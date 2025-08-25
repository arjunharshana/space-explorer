document.addEventListener("DOMContentLoaded", () => {
  const API_KEY = "oFqymIsrfGCUrXtqxVwBSM1wPKobSdfrvwMUg6Z1";
  const API_URL = "https://api.nasa.gov/planetary/apod";

  const dom = {
    loader: document.getElementById("loader"),
    errorMessage: document.getElementById("error-message"),
    errorDetails: document.getElementById("error-details"),
    contentWrapper: document.getElementById("content-wrapper"),
    navigation: document.getElementById("navigation"),
    image: document.getElementById("apod-image"),
    video: document.getElementById("apod-video"),
    title: document.getElementById("apod-title"),
    date: document.getElementById("apod-date"),
    explanation: document.getElementById("apod-explanation"),
    prevBtn: document.getElementById("prev-btn"),
    nextBtn: document.getElementById("next-btn"),
    todayBtn: document.getElementById("today-btn"),
  };

  let currentDate = new Date();

  const formatDate = (date) => date.toISOString().slice(0, 10);
  const getTodayDateString = () => formatDate(new Date());

  const loadImage = (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
      img.src = src;
    });
  };

  // Rendering the fetched APOD data
  const renderApodData = (data) => {
    const { title, date, explanation, media_type, hdurl, url } = data;

    dom.title.textContent = title;
    dom.date.textContent = new Date(date + "T12:00:00Z").toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "UTC",
      }
    );
    dom.explanation.textContent = explanation;

    const isImage = media_type === "image";
    dom.image.src = isImage ? hdurl || url : "";
    dom.image.alt = isImage ? title : "";
    dom.image.style.display = isImage ? "block" : "none";

    dom.video.src = !isImage ? url : "";
    dom.video.style.display = !isImage ? "block" : "none";

    dom.contentWrapper.classList.add("fade-in");
    setTimeout(() => dom.contentWrapper.classList.remove("fade-in"), 500);
  };

  const setUIState = (state, message = "") => {
    dom.loader.classList.toggle("hidden", state !== "loading");
    dom.errorMessage.classList.toggle("hidden", state !== "error");
    dom.contentWrapper.classList.toggle("hidden", state !== "content");
    dom.navigation.classList.toggle("hidden", state !== "content");

    if (state === "error") {
      dom.errorDetails.textContent = message;
    }
  };

  const updateNavButtons = () => {
    const today = getTodayDateString();
    const currentDateStr = formatDate(currentDate);
    dom.nextBtn.disabled = currentDateStr >= today;
    dom.todayBtn.disabled = currentDateStr === today;
  };

  // fetching apod data
  const fetchApod = async (dateString) => {
    setUIState("loading");

    try {
      let data;
      const cachedData = sessionStorage.getItem(dateString);
      if (cachedData) {
        data = JSON.parse(cachedData);
      } else {
        const response = await fetch(
          `${API_URL}?api_key=${API_KEY}&date=${dateString}`
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.msg || `HTTP error! Status: ${response.status}`
          );
        }
        data = await response.json();
        sessionStorage.setItem(dateString, JSON.stringify(data));
      }

      // Preload image before showing content
      if (data.media_type === "image") {
        const imageUrl = data.hdurl || data.url;
        await loadImage(imageUrl);
      }

      renderApodData(data);
      setUIState("content");
    } catch (error) {
      console.error("Fetch error:", error);
      setUIState("error", error.message);
    } finally {
      updateNavButtons();
    }
  };

  const handleDateChange = (days) => {
    currentDate.setDate(currentDate.getDate() + days);
    fetchApod(formatDate(currentDate));
  };

  dom.prevBtn.addEventListener("click", () => handleDateChange(-1));
  dom.nextBtn.addEventListener("click", () => handleDateChange(1));
  dom.todayBtn.addEventListener("click", () => {
    currentDate = new Date();
    fetchApod(formatDate(currentDate));
  });

  // Initial fetch for today's date
  fetchApod(formatDate(currentDate));
});
