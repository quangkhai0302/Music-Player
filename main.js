const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

const PLAYER_STORAGE_KEY = "MUSIC-PLAYER";

const player = $(".player");
const playBtn = $(".btn-toggle-play");
const audio = $("#audio");
const cdThumb = $(".cd-thumb");
const progress = $(".progress");
const nextBtn = $(".btn-next");
const prevBtn = $(".btn-prev");
const randomBtn = $(".btn-random");
const repeatBtn = $(".btn-repeat");
const volumnBtn = $(".volumn-wrapper");
const rangeVolumn = $(".range");

const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');

function formatTime(time) {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

audio.addEventListener('loadedmetadata', () => {
  durationEl.textContent = formatTime(audio.duration);
});

audio.addEventListener('timeupdate', () => {
  currentTimeEl.textContent = formatTime(audio.currentTime);
});

const app = {
  currentIndex: 0,
  volumeValue: 0,
  isPlaying: false,
  isRandom: false,
  isRepeat: false,
  isMuted: false,
  isMouseDowned: false,
  isClickedActive: false,
  // Tạo config lưu trạng thái của randomBtn và repeatBtn
  config: JSON.parse(localStorage.getItem(PLAYER_STORAGE_KEY)) || {},
  // Lưu thông tin các bài hát
  songs: [
    {
      name: "Promise for the future",
      singer: "Hatanaka Tasuku",
      path: "./assets/music/song1.mp3",
      image: "./assets/img/song1.jpg",
    },
    {
      name: "Spirit",
      singer: "Project DMM",
      path: "./assets/music/song2.mp3",
      image: "./assets/img/song2.jpg",
    },
    {
      name: "Suýt nữa thì",
      singer: "Andiez",
      path: "./assets/music/song3.mp3",
      image: "./assets/img/song3.jpg",
    },
    {
      name: "Chiều hôm ấy",
      singer: "Jaykii",
      path: "./assets/music/song4.mp3",
      image: "./assets/img/song4.jpg",
    },
    {
      name: "Something you can do",
      singer: "Project DMM",
      path: "./assets/music/song5.mp3",
      image: "./assets/img/song5.jpg",
    },
    {
      name: "Unite",
      singer: "Voyager",
      path: "./assets/music/song6.mp3",
      image: "./assets/img/song6.jpg",
    },
    {
      name: "Be The One",
      singer: "Beverly",
      path: "./assets/music/song7.mp3",
      image: "./assets/img/song7.jpg",
    },
    {
      name: "Đáp án cuối cùng",
      singer: "Quân AP",
      path: "./assets/music/song8.mp3",
      image: "./assets/img/song8.jpg",
    },
    {
      name: "Kẻ theo đuổi ánh sáng",
      singer: "Huy Vạc",
      path: "./assets/music/song9.mp3",
      image: "./assets/img/song9.jpg",
    },
    {
      name: "Pretender",
      singer: "Official HIGE DANdism",
      path: "./assets/music/song10.mp3",
      image: "./assets/img/song10.jpg",
    },
  ],
  // Hàm set config
  setConfig: function (key, value) {
    this.config[key] = value;
    localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(this.config));
  },
  // Render Songs
  // Scroll Top
  // Play/Pause/Seek
  // CD Rotate
  // Next/Prev
  // Random
  // Next/Repeat when ended
  // Active Song
  // Scroll active song into view
  // Play Song when click
  // Fix lỗi tua bài hát, vì ontimeupdate chạy liên tục nên gây ra lỗi
  // Thêm nút điều chỉnh âm lượng, lưu thông số âm lượng của người dùng, mặc định là 100%
  // Lưu vị trí bài hát đang nghe, f5 lại trang không trở về bài đầu tiên
  // Lưu vị trí currentTime của audio, khi reload không play lại từ đầu
  // Hàm render bài hát ra giao diện
  render: function () {
    const playList = $(".playlist");
    this.songs.forEach(function (song, index) {
      playList.innerHTML += `
      <div class="song ${index === 0 ? "active" : ""}">
        <div class="thumb" style="background-image: url('${song.image}')"></div>
        <div class="body">
            <h3 class="title">${song.name}</h3>
            <p class="author">${song.singer}</p>
        </div>
        <div class="option">
            <i class="fas fa-ellipsis-h"></i>
        </div>
    </div>
      `;
    });
  },
  // Tạo hàm define property để tạo ra phương thức để truy cập vào bài hát hiện tại
  defineProperties: function () {
    Object.defineProperty(this, "currentSong", {
      get: function () {
        //return this.songs[this.currentIndex];
        if (this.currentIndex >= 0 && this.currentIndex < this.songs.length) {
          return this.songs[this.currentIndex];
        } else {
          // Return a default song or handle the out of range case
          return { name: "No song available", singer: "", path: "", image: "" };
        }
      },
    });
  },
  // Hàm load config khi load lại trang
  loadConfig: function () {
    this.volumeValue = this.config.volume;
    this.isRandom = this.config.isRandom;
    this.isRepeat = this.config.isRepeat;
    this.isMuted = this.config.isMuted;
    this.currentIndex = this.config.currentIndex;
    randomBtn.classList.toggle("active", this.isRandom);
    repeatBtn.classList.toggle("active", this.isRepeat);
    volumnBtn.classList.toggle("active", this.isMuted);
    rangeVolumn.value = this.volumeValue;
    progress.value = this.config.progressValue;
    this.activeSong();
  },
  // Hàm load bài hát hiện tại
  loadCurrentSong: function () {
    const headerH2 = $("header h2");
    const audio = $("#audio");
    headerH2.innerText = this.currentSong.name;
    cdThumb.style.backgroundImage = `url('${this.currentSong.image}')`;
    audio.src = this.currentSong.path;
  },
  // Hàm xử lý các sự kiện
  handleEvents: function () {
    const _this = this;
    const cd = $(".cd");
    const cdWidth = cd.offsetWidth;

    // Tạo animation cho cd
    const cdThumbAnimate = cdThumb.animate([{ transform: "rotate(360deg)" }], {
      duration: 10000,
      iterations: Infinity,
    });
    cdThumbAnimate.pause();

    // Hàm xử lý khi scroll giao diện để đẩy cd lên
    document.onscroll = function () {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const newCdWidth = cdWidth - scrollTop;
      cd.style.width = newCdWidth > 0 ? newCdWidth + "px" : 0;
      cd.style.opacity = newCdWidth / cdWidth;
    };

    // Hàm xử lý khi play/pause
    playBtn.addEventListener("click", function () {
      player.classList.toggle("playing");
      if (player.classList.contains("playing")) {
        audio.play();
        progress.value = _this.config.progressValue;
        audio.currentTime = (progress.value / 100) * audio.duration;
        _this.isPlaying = true;
        cdThumbAnimate.play();
      } else {
        audio.pause();
        _this.isPlaying = false;
        cdThumbAnimate.pause();
      }
    });

    // Hàm xử lý để thanh progress chạy khi phát audio
    audio.ontimeupdate = function () {
      changeVolumn();
      const duration = this.duration;
      const currentTime = this.currentTime;
      if (_this.isPlaying && !_this.isMouseDowned) {
        progress.value = (currentTime / duration) * 100;
        _this.setConfig("progressValue", progress.value);
      }
    };

    // Hàm xử lý khi tua bài hát
    progress.onchange = function (e) {
      const value = e.target.value;
      _this.setConfig("progressValue", value);
      const currentTime = (value / 100) * audio.duration; // (audio.duration/100)* value
      audio.currentTime = currentTime;
    };

    // Hàm xử lý khi mousedown vào thanh progress
    progress.onmousedown = function () {
      _this.isMouseDowned = true;
    };

    // Hàm xử lý khi mouseup vào thanh progress
    progress.onmouseup = function () {
      _this.isMouseDowned = false;
    };

    // Hàm xử lý khi chỉnh âm lượng
    function changeVolumn() {
      _this.volumeValue = rangeVolumn.value;
      _this.setConfig("volume", _this.volumeValue);
      const currentValue = (rangeVolumn.value / 100).toFixed(1);
      if (currentValue == 0.0 || _this.isClickedActive) {
        volumnBtn.classList.add("active");
        _this.isMuted = true;
        audio.muted = true;
        _this.setConfig("isMuted", _this.isMuted);
      } else {
        volumnBtn.classList.remove("active");
        _this.isMuted = false;
        audio.muted = false;
        _this.setConfig("isMuted", _this.isMuted);
      }
      audio.volume = currentValue;
    }

    // Hàm xử lý khi ấn next bài hát
    nextBtn.onclick = function () {
      if (_this.isRandom) {
        _this.randomSong();
      } else {
        _this.nextSong();
      }
      cdThumbAnimate.play();
      player.classList.add("playing");
      audio.play();
      _this.activeSong();
    };

    // Hàm xử lý khi ấn prev bài hát
    prevBtn.onclick = function () {
      if (_this.isRandom) {
        _this.randomSong();
      } else {
        _this.prevSong();
      }
      cdThumbAnimate.play();
      player.classList.add("playing");
      audio.play();
      _this.activeSong();
    };

    // Hàm xử lý khi ấn random bài hát
    randomBtn.onclick = function () {
      this.classList.toggle("active");
      if (this.classList.contains("active")) {
        _this.isRandom = true;
        _this.setConfig("isRandom", true);
      } else {
        _this.isRandom = false;
        _this.setConfig("isRandom", false);
      }
    };

    // Hàm xử lý khi ấn repeat bài hát
    repeatBtn.onclick = function () {
      this.classList.toggle("active");
      if (this.classList.contains("active")) {
        _this.isRepeat = true;
        _this.setConfig("isRepeat", true);
      } else {
        _this.isRepeat = false;
        _this.setConfig("isRepeat", false);
      }
    };

    // Hàm xử lý khi bài hát kết thúc
    audio.onended = function () {
      if (_this.isRepeat) audio.play();
      else nextBtn.click();
    };

    // Hàm xử lý khi click vào volumn button
    volumnBtn.onclick = function () {
      this.classList.toggle("active");
      if (this.classList.contains("active")) {
        _this.isClickedActive = true;
        _this.isMuted = true;
        audio.muted = true;
        _this.setConfig("isMuted", true);
      } else {
        _this.isClickedActive = false;
        _this.isMuted = false;
        audio.muted = false;
        _this.setConfig("isMuted", false);
      }
    };

    // Hàm xử lý khi click vào bài hát để chuyển bài
    const clickSong = (function () {
      const songs = $$(".song");
      songs.forEach(function (song, index) {
        song.onclick = function () {
          if (!this.classList.contains("active")) {
            _this.currentIndex = index;
            _this.setConfig("currentIndex", index);
            _this.loadCurrentSong();
            player.classList.add("playing");
            audio.play();
            _this.activeSong();
          }
        };
      });
    })();
  },
  // Hàm random bài hát
  randomSong: function () {
    let currentIndex;
    do {
      currentIndex = Math.floor(Math.random() * 10);
    } while (this.currentIndex === currentIndex);
    this.currentIndex = currentIndex;
    this.setConfig("currentIndex", currentIndex);
    this.loadCurrentSong();
  },
  // Hàm chuyển next bài hát
  nextSong: function () {
    this.currentIndex++;
    if (this.currentIndex >= this.songs.length) {
      this.currentIndex = 0;
    }
    this.setConfig("currentIndex", this.currentIndex);
    this.loadCurrentSong();
  },
  // Hàm chuyển prev bài hát
  prevSong: function () {
    this.currentIndex--;
    if (this.currentIndex < 0) {
      this.currentIndex = this.songs.length - 1;
    }
    this.setConfig("currentIndex", this.currentIndex);
    this.loadCurrentSong();
  },
  // Hàm kích hoạt bài hát hiện tại
  activeSong: function () {
    const currentIndex = this.currentIndex;
    const songs = $$(".song");
    songs.forEach(function (song, index) {
      if (index === currentIndex) {
        song.classList.add("active");
        setTimeout(function () {
          song.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }, 300);
      } else song.classList.remove("active");
    });
  },
  // Hàm bắt đầu chương trình
  start: function () {
    this.loadConfig();
    this.defineProperties();
    this.loadCurrentSong();
    this.render();
    this.loadConfig();
    this.handleEvents();
  },
};
app.start();
