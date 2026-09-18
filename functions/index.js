const functions = require("firebase-functions");
const admin = require("firebase-admin");
const Iyzipay = require("iyzipay");

admin.initializeApp();
const db = admin.firestore();

// Iyzico yapılandırması: anahtarlar kodda tutulmaz.
// Yerel geliştirme: functions/.env (git'e girmez, örnek: functions/.env.example)
// Canlı ortam: Firebase Secret Manager (firebase functions:secrets:set IYZICO_SECRET_KEY)
let iyzipayClient = null;
function getIyzipay() {
  if (!iyzipayClient) {
    const { IYZICO_API_KEY, IYZICO_SECRET_KEY } = process.env;
    if (!IYZICO_API_KEY || !IYZICO_SECRET_KEY) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Ödeme altyapısı yapılandırılmamış."
      );
    }
    iyzipayClient = new Iyzipay({
      apiKey: IYZICO_API_KEY,
      secretKey: IYZICO_SECRET_KEY,
      uri: process.env.IYZICO_BASE_URL || "https://sandbox-api.iyzipay.com",
    });
  }
  return iyzipayClient;
}

// ========================================
// 1. ÖDEME FORMU BAŞLAT (Checkout Form)
// ========================================
exports.createPayment = functions.https.onCall(async (data, context) => {
  // Kullanıcı giriş yapmış mı kontrol et
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Giriş yapmalısınız"
    );
  }

  const userId = context.auth.uid;
  const { amount, packageName } = data;

  // Kullanıcı bilgilerini al
  const userDoc = await db.collection("users").doc(userId).get();
  const userData = userDoc.data();

  // Benzersiz sepet ID'si
  const basketId = `basket_${userId}_${Date.now()}`;
  const conversationId = `conv_${Date.now()}`;

  const request = {
    locale: Iyzipay.LOCALE.TR,
    conversationId: conversationId,
    price: amount.toString(),
    paidPrice: amount.toString(),
    currency: Iyzipay.CURRENCY.TRY,
    basketId: basketId,
    paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
    callbackUrl: `https://us-central1-${process.env.GCLOUD_PROJECT}.cloudfunctions.net/paymentCallback`,
    enabledInstallments: [1],
    buyer: {
      id: userId,
      name: userData?.name?.split(" ")[0] || "İsim",
      surname: userData?.name?.split(" ")[1] || "Soyisim",
      gsmNumber: userData?.phone || "+905551234567",
      email: userData?.email || context.auth.token.email || "test@test.com",
      identityNumber: "11111111111",
      registrationAddress: userData?.address || "Türkiye",
      ip: "85.34.78.112",
      city: "Istanbul",
      country: "Turkey",
    },
    shippingAddress: {
      contactName: userData?.name || "İsim Soyisim",
      city: "Istanbul",
      country: "Turkey",
      address: userData?.address || "Türkiye",
    },
    billingAddress: {
      contactName: userData?.name || "İsim Soyisim",
      city: "Istanbul",
      country: "Turkey",
      address: userData?.address || "Türkiye",
    },
    basketItems: [
      {
        id: `balance_${amount}`,
        name: packageName || `${amount} TL Bakiye Yükleme`,
        category1: "Bakiye",
        itemType: Iyzipay.BASKET_ITEM_TYPE.VIRTUAL,
        price: amount.toString(),
      },
    ],
  };

  return new Promise((resolve, reject) => {
    getIyzipay().checkoutFormInitialize.create(request, (err, result) => {
      if (err) {
        console.error("Iyzico Hata:", err);
        reject(new functions.https.HttpsError("internal", "Ödeme başlatılamadı"));
      } else {
        // Ödeme kaydını Firestore'a kaydet
        db.collection("payments").doc(basketId).set({
          userId: userId,
          amount: amount,
          packageName: packageName,
          status: "pending",
          conversationId: conversationId,
          token: result.token,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        resolve({
          status: result.status,
          paymentPageUrl: result.paymentPageUrl,
          token: result.token,
        });
      }
    });
  });
});

// ========================================
// 2. ÖDEME CALLBACK (Iyzico'dan dönen)
// ========================================
exports.paymentCallback = functions.https.onRequest(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).send("Token bulunamadı");
  }

  const request = {
    locale: Iyzipay.LOCALE.TR,
    conversationId: `callback_${Date.now()}`,
    token: token,
  };

  getIyzipay().checkoutForm.retrieve(request, async (err, result) => {
    if (err) {
      console.error("Callback Hata:", err);
      return res.redirect("ustabul://payment-failed");
    }

    console.log("Ödeme Sonucu:", result);

    if (result.status === "success" && result.paymentStatus === "SUCCESS") {
      // Ödeme başarılı - Bakiyeyi güncelle
      const basketId = result.basketId;
      const paymentDoc = await db.collection("payments").doc(basketId).get();

      if (paymentDoc.exists) {
        const paymentData = paymentDoc.data();
        const userId = paymentData.userId;
        const amount = parseFloat(paymentData.amount);

        // Bonus hesapla
        let bonus = 0;
        if (amount >= 200) bonus = 40;
        else if (amount >= 100) bonus = 15;
        else if (amount >= 50) bonus = 5;

        const totalAmount = amount + bonus;

        // Kullanıcı bakiyesini güncelle
        await db.collection("users").doc(userId).update({
          walletBalance: admin.firestore.FieldValue.increment(totalAmount),
        });

        // İşlem geçmişine ekle
        await db.collection("transactions").add({
          userId: userId,
          type: "deposit",
          amount: totalAmount,
          originalAmount: amount,
          bonus: bonus,
          description: bonus > 0 
            ? `Bakiye yükleme (+${bonus}₺ bonus)` 
            : "Bakiye yükleme",
          paymentMethod: "iyzico",
          paymentId: result.paymentId,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Payment durumunu güncelle
        await db.collection("payments").doc(basketId).update({
          status: "success",
          paymentId: result.paymentId,
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Başarılı - Uygulamaya yönlendir
        return res.redirect("ustabul://payment-success");
      }
    }

    // Başarısız
    return res.redirect("ustabul://payment-failed");
  });
});

// ========================================
// 3. ÖDEME DURUMU KONTROL
// ========================================
exports.checkPaymentStatus = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Giriş yapmalısınız");
  }

  const { token } = data;

  const request = {
    locale: Iyzipay.LOCALE.TR,
    conversationId: `check_${Date.now()}`,
    token: token,
  };

  return new Promise((resolve, reject) => {
    getIyzipay().checkoutForm.retrieve(request, (err, result) => {
      if (err) {
        reject(new functions.https.HttpsError("internal", "Durum kontrol edilemedi"));
      } else {
        resolve({
          status: result.status,
          paymentStatus: result.paymentStatus,
        });
      }
    });
  });
});