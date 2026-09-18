import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";
import { useAuth } from "./AuthContext";
import { useUI } from "./UIContext";

const JobContext = createContext();

export const JobProvider = ({ children }) => {
  const { user, userRole, userProfile } = useAuth();
  const { sendNotification, alertError } = useUI();

  const [jobs, setJobs] = useState([]);
  const [lastVisible, setLastVisible] = useState(null);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [favorites, setFavorites] = useState([]);

  const fetchInitialJobs = useCallback(
    async (filters = {}) => {
      if (!user) return;
      setIsLoading(true);
      setHasMore(true);
      setJobs([]);

      try {
        let q = firestore().collection("jobs").where("status", "==", "Aktif");

        if (filters.city && filters.city !== "Tümü") {
          q = q.where("city", "==", filters.city);
        }

        if (filters.category && filters.category !== "Tümü" && filters.category !== "Hepsi") {
          q = q.where("serviceId", "==", filters.category);
        }

        q = q.orderBy("createdAt", "desc").limit(20);

        const snapshot = await q.get();

        if (snapshot.empty) {
          setJobs([]);
          setHasMore(false);
        } else {
          setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
          const fetchedJobs = snapshot.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id,
          }));
          setJobs(fetchedJobs);
        }
      } catch (error) {
        // Auth henüz hazır değilse sessizce geç
        if (error.code !== 'firestore/permission-denied') {
          console.error("İş çekme hatası:", error);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [user],
  );

  const loadMoreJobs = async (filters = {}) => {
    if (!hasMore || isFetchingMore || !lastVisible) return;

    setIsFetchingMore(true);
    try {
      let q = firestore().collection("jobs").where("status", "==", "Aktif");

      if (filters.city && filters.city !== "Tümü") {
        q = q.where("city", "==", filters.city);
      }
      if (filters.category && filters.category !== "Tümü" && filters.category !== "Hepsi") {
        q = q.where("serviceId", "==", filters.category);
      }

      q = q.orderBy("createdAt", "desc").startAfter(lastVisible).limit(10);

      const snapshot = await q.get();

      if (snapshot.empty) {
        setHasMore(false);
      } else {
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
        const newJobs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setJobs((prev) => [...prev, ...newJobs]);
      }
    } catch (error) {
      console.error("Daha fazla yükleme hatası:", error);
    } finally {
      setIsFetchingMore(false);
    }
  };

  useEffect(() => {
    if (!user?.uid) {
      setJobs([]);
      return;
    }
    // Kısa bir gecikme ekle - auth token'ın hazır olmasını bekle
    const timer = setTimeout(() => {
      fetchInitialJobs();
    }, 500);
    return () => clearTimeout(timer);
  }, [user?.uid, fetchInitialJobs]);

  const uploadJobPhotos = async (localPhotos, jobId) => {
    const uploadedUrls = [];
    for (const uri of localPhotos) {
      try {
        const filename = `jobs/${jobId}/${Date.now()}_${uploadedUrls.length}.jpg`;
        const storageRef = storage().ref(filename);
        await storageRef.putFile(uri);
        const url = await storageRef.getDownloadURL();
        uploadedUrls.push(url);
      } catch (e) {
        console.error("Fotoğraf yükleme hatası:", e);
      }
    }
    return uploadedUrls;
  };

  const addJob = async (newJob) => {
    if (!user) return;
    try {
      const { jobPhotos, ...jobData } = newJob;

      const docRef = await firestore().collection("jobs").add({
        ...jobData,
        jobPhotos: [],
        userId: user.uid,
        createdAt: firestore.FieldValue.serverTimestamp(),
        status: "Aktif",
        offerCount: 0,
        offeredProIds: [],
      });

      // Fotoğrafları Storage'a yükle ve Firestore'u güncelle
      if (jobPhotos && jobPhotos.length > 0) {
        const uploadedUrls = await uploadJobPhotos(jobPhotos, docRef.id);
        await docRef.update({ jobPhotos: uploadedUrls });
      }

      fetchInitialJobs();
    } catch (e) {
      if (alertError) alertError("Hata", "İlan eklenemedi: " + e.message);
    }
  };

  const addOffer = async (jobId, offerPrice, offerDesc = "") => {
    if (userRole !== "pro")
      return { success: false, error: "Sadece ustalar teklif verebilir." };
    if (!jobId) return { success: false, error: "İlan ID'si geçersiz." };

    try {
      const jobRef = firestore().collection("jobs").doc(jobId);
      let customerId = null;

      // Transaction ile atomik işlem (race condition önleme)
      await firestore().runTransaction(async (transaction) => {
        const jobSnap = await transaction.get(jobRef);
        const userRef = firestore().collection("users").doc(user.uid);
        const userSnap = await transaction.get(userRef);

        if (!jobSnap.exists) {
          throw new Error("Bu ilan silinmiş.");
        }

        const jobData = jobSnap.data();
        const userData = userSnap.data() || {};

        if (jobData.userId === user.uid) {
          throw new Error("Kendi ilanınıza teklif veremezsiniz.");
        }
        if (jobData.status !== "Aktif") {
          throw new Error("Bu iş tekliflere kapalı.");
        }
        if (jobData.offeredProIds?.includes(user.uid)) {
          throw new Error("Bu ilana zaten teklif verdiniz.");
        }

        // Abonelik kontrolü - abone olmayanlar max 1 teklif
        const isSubActive = userData.isSubscriptionActive && userData.subscriptionEndDate;
        let hasActiveSubscription = false;

        if (isSubActive) {
          const endDate = userData.subscriptionEndDate.seconds
            ? new Date(userData.subscriptionEndDate.seconds * 1000)
            : new Date(userData.subscriptionEndDate);
          hasActiveSubscription = endDate > new Date();
        }

        if (!hasActiveSubscription) {
          const totalOffers = userData.totalOffersMade || 0;
          if (totalOffers >= 1) {
            throw new Error("Daha fazla teklif vermek için abonelik satın almalısınız.");
          }
        }

        customerId = jobData.userId;

        const newOfferData = {
          proId: user.uid,
          ustaName: userProfile?.name || user.email || "İsimsiz Usta",
          photo: userProfile?.photo || null,
          price: Number(offerPrice),
          desc: offerDesc,
          createdAt: firestore.FieldValue.serverTimestamp(),
          date: new Date().toLocaleDateString("tr-TR"),
          status: "waiting",
          isVerifiedBadge: userData.isVerifiedBadge || false,
        };

        // Yeni teklif için referans oluştur
        const offerRef = jobRef.collection("offers").doc();

        // Transaction içinde teklifi ekle
        transaction.set(offerRef, newOfferData);

        // Transaction içinde iş dokümanını güncelle
        transaction.update(jobRef, {
          offerCount: firestore.FieldValue.increment(1),
          offeredProIds: firestore.FieldValue.arrayUnion(user.uid),
        });

        // totalOffersMade sayacını artır
        transaction.update(userRef, {
          totalOffersMade: firestore.FieldValue.increment(1),
        });
      });

      // Bildirim gönder (transaction dışında - kritik değil)
      try {
        if (customerId) {
          await sendNotification({
            text: "İlanına yeni bir teklif geldi! 💰",
            targetUserId: customerId,
            targetRole: "customer",
            data: { type: "JOB", jobId: jobId },
          });
        }
      } catch (notifError) {
        console.log("Bildirim gönderilemedi:", notifError);
      }

      return { success: true };
    } catch (e) {
      console.error("Teklif verme hatası:", e);
      return { success: false, error: e.message };
    }
  };

  const acceptOffer = async (jobId, offerId) => {
    try {
      const jobRef = firestore().collection("jobs").doc(jobId);
      const offerRef = jobRef.collection("offers").doc(offerId);
      let proId = null;

      // Transaction ile atomik işlem (aynı anda iki kişi kabul edemez)
      await firestore().runTransaction(async (transaction) => {
        const jobSnap = await transaction.get(jobRef);
        const offerSnap = await transaction.get(offerRef);

        if (!jobSnap.exists) {
          throw new Error("İlan bulunamadı.");
        }

        if (!offerSnap.exists) {
          throw new Error("Teklif bulunamadı.");
        }

        const jobData = jobSnap.data();
        const offerData = offerSnap.data();

        if (jobData.status !== "Aktif") {
          throw new Error("Bu iş için zaten bir anlaşma yapılmış veya iş aktif değil.");
        }

        proId = offerData.proId;

        transaction.update(jobRef, {
          status: "Onay Bekliyor",
          acceptedOfferId: offerId,
          acceptedProId: offerData.proId,
          acceptedPrice: offerData.price,
        });

        transaction.update(offerRef, { status: "accepted" });
      });

      // Bildirim gönder (transaction dışında)
      try {
        if (proId) {
          await sendNotification({
            text: "Tebrikler! Müşteri teklifini kabul etti. İşi başlatmak için tıkla. 🚀",
            targetUserId: proId,
            targetRole: "pro",
            data: { type: "JOB", jobId },
          });
        }
      } catch (notifError) {
        console.log("Bildirim gönderilemedi:", notifError);
      }

      return true;
    } catch (e) {
      console.error("acceptOffer HATA:", e);
      if (alertError) alertError("Hata", e.message || "İşlem sırasında bir sorun oluştu.");
      return false;
    }
  };

  const proConfirmJob = async (jobId) => {
    try {
      const jobRef = firestore().collection("jobs").doc(jobId);
      const jobSnap = await jobRef.get();
      let customerId = null;
      if (jobSnap.exists) customerId = jobSnap.data().userId;

      await jobRef.update({
        status: "Devam Ediyor",
        proStartedAt: firestore.FieldValue.serverTimestamp(),
      });

      try {
        if (customerId) {
          await sendNotification({
            text: "Usta işi başlattı! Çalışmalar başladı. 🔨",
            targetUserId: customerId,
            targetRole: "customer",
            data: { type: "JOB", jobId },
          });
        }
      } catch (notifError) {
        console.log("Bildirim gönderilemedi:", notifError);
      }
      return true;
    } catch (e) {
      console.log("proConfirmJob hatası:", e);
      return false;
    }
  };

  const proFinishJob = async (jobId, proId, earnedAmount) => {
    setIsLoading(true);
    try {
      const batch = firestore().batch();
      const jobRef = firestore().collection("jobs").doc(jobId);
      const userRef = firestore().collection("users").doc(proId);

      batch.update(jobRef, {
        status: "Teslim Bekliyor",
        proFinishedAt: firestore.FieldValue.serverTimestamp(),
      });
      batch.update(userRef, { completedJobsCount: firestore.FieldValue.increment(1) });

      await batch.commit();

      try {
        const jobSnap = await jobRef.get();
        if (jobSnap.exists) {
          const customerId = jobSnap.data().userId;
          if (customerId) {
            await sendNotification({
              text: "Usta işi bitirdiğini bildirdi. Lütfen onaylayın. ✅",
              targetUserId: customerId,
              targetRole: "customer",
              data: { type: "JOB", jobId },
            });
          }
        }
      } catch (notifError) {
        console.log("Bildirim gönderilemedi:", notifError);
      }
    } catch (e) {
      console.log("proFinishJob hatası:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const customerFinalizeJob = async (jobId) => {
    try {
      const jobRef = firestore().collection("jobs").doc(jobId);
      const jobSnap = await jobRef.get();

      if (jobSnap.exists) {
        const proId = jobSnap.data().acceptedProId;
        await jobRef.update({
          status: "Tamamlandı",
          completedAt: firestore.FieldValue.serverTimestamp(),
        });

        try {
          if (proId) {
            await sendNotification({
              text: "Müşteri işi onayladı ve tamamladı. Puanlama bekleniyor. 🌟",
              targetUserId: proId,
              targetRole: "pro",
              data: { type: "JOB", jobId },
            });
          }
        } catch (notifError) {
          console.log("Bildirim gönderilemedi:", notifError);
        }
      }
    } catch (e) {
      console.log("customerFinalizeJob hatası:", e);
    }
  };

  const cancelJob = async (jobId) => {
    try {
      const jobRef = firestore().collection("jobs").doc(jobId);
      const jobSnap = await jobRef.get();
      const data = jobSnap.data();
      const proId = data.acceptedProId;

      await jobRef.update({
        status: "İptal",
        acceptedOfferId: null,
        acceptedProId: null,
      });

      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, status: "İptal" } : j)),
      );

      try {
        if (proId) {
          await sendNotification({
            text: "İş anlaşması iptal edildi. ❌",
            targetUserId: proId,
            targetRole: "pro",
            data: { type: "JOB", jobId },
          });
        }
      } catch (notifError) {
        console.log("Bildirim gönderilemedi:", notifError);
      }
    } catch (e) {
      console.log("cancelJob hatası:", e);
    }
  };

  const addReview = async (jobId, rating, comment) => {
    try {
      const jobRef = firestore().collection("jobs").doc(jobId);
      const jobSnap = await jobRef.get();
      if (!jobSnap.exists) return;
      const proId = jobSnap.data().acceptedProId;

      await jobRef.update({
        status: "Değerlendirildi",
        userRating: rating,
        userComment: comment,
      });

      setJobs((prev) =>
        prev.map((j) =>
          j.id === jobId ? { ...j, status: "Değerlendirildi" } : j,
        ),
      );

      try {
        if (proId) {
          await sendNotification({
            text: `Müşteri sana ${rating} yıldız verdi! ⭐`,
            targetUserId: proId,
            targetRole: "pro",
            data: { type: "JOB", jobId },
          });
        }
      } catch (notifError) {
        console.log("Bildirim gönderilemedi:", notifError);
      }
    } catch (e) {
      console.log("addReview hatası:", e);
    }
  };

  const deletePhotoFromStorage = async (photoUrl) => {
    try {
      const ref = storage().refFromURL(photoUrl);
      await ref.delete();
    } catch (e) {
      console.log("Fotoğraf silme hatası (zaten silinmiş olabilir):", e);
    }
  };

  const updateJob = async (jobId, updatedFields, newPhotos = [], removedPhotoUrls = []) => {
    if (!user) return { success: false, error: "Giriş yapılmamış." };

    try {
      const jobRef = firestore().collection("jobs").doc(jobId);
      const jobSnap = await jobRef.get();

      if (!jobSnap.exists) {
        return { success: false, error: "İlan bulunamadı." };
      }

      const jobData = jobSnap.data();

      if (jobData.userId !== user.uid) {
        return { success: false, error: "Bu ilanı düzenleme yetkiniz yok." };
      }

      if (jobData.status !== "Aktif") {
        return { success: false, error: "Sadece aktif ilanlar düzenlenebilir." };
      }

      // Mevcut fotoğraflardan silinen fotoğrafları çıkar
      const remainingPhotos = (jobData.jobPhotos || []).filter(
        (url) => !removedPhotoUrls.includes(url)
      );

      // Yeni fotoğrafları yükle
      let uploadedNewUrls = [];
      if (newPhotos.length > 0) {
        uploadedNewUrls = await uploadJobPhotos(newPhotos, jobId);
      }

      const finalPhotos = [...remainingPhotos, ...uploadedNewUrls];

      // Firestore güncelle
      await jobRef.update({
        ...updatedFields,
        jobPhotos: finalPhotos,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

      // Silinen fotoğrafları Storage'dan temizle
      for (const url of removedPhotoUrls) {
        await deletePhotoFromStorage(url);
      }

      // Local state güncelle
      setJobs((prev) =>
        prev.map((j) =>
          j.id === jobId
            ? { ...j, ...updatedFields, jobPhotos: finalPhotos }
            : j
        )
      );

      return { success: true };
    } catch (e) {
      console.error("İlan güncelleme hatası:", e);
      return { success: false, error: e.message };
    }
  };

  const updateOffer = async (jobId, offerId, newPrice) => {
    setIsLoading(true);
    try {
      const offerRef = firestore().collection("jobs").doc(jobId).collection("offers").doc(offerId);
      await offerRef.update({
        price: Number(newPrice),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error("Güncelleme hatası:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFavorite = async (ustaName) => {
    let newFavs = [];
    if (favorites.includes(ustaName)) {
      newFavs = favorites.filter((f) => f !== ustaName);
    } else {
      newFavs = [...favorites, ustaName];
    }
    setFavorites(newFavs);

    if (user) {
      try {
        const userRef = firestore().collection("users").doc(user.uid);
        await userRef.update({ favorites: newFavs });
      } catch (e) {
        console.log("Favori hatası:", e);
      }
    }
  };

  useEffect(() => {
    if (userProfile && userProfile.favorites) {
      setFavorites(userProfile.favorites);
    }
  }, [userProfile]);

  return (
    <JobContext.Provider
      value={{
        jobs,
        fetchInitialJobs,
        loadMoreJobs,
        isFetchingMore,
        isLoading,
        hasMore,
        addJob,
        addOffer,
        acceptOffer,
        proConfirmJob,
        proFinishJob,
        customerFinalizeJob,
        cancelJob,
        addReview,
        updateJob,
        updateOffer,
        favorites,
        toggleFavorite,
      }}
    >
      {children}
    </JobContext.Provider>
  );
};

export const useJobs = () => useContext(JobContext);
