import "./style.css";
import {
  auth,
  getData,
  changeEngineStatus,
  saveWinner,
  sortByWins,
  sortByTime,
  createCar,
  updateCar,
  deleteWinner,
  bulkCreateCars,
  deleteAll,
  getMyStats,
  reportRaceGuess,
  type CarDto,
} from "./api";

interface Car {
  id: number;
  name: string;
  color: string;
}
interface Winner {
  id: number;
  wins: number;
  time: number;
}
interface ExtendedWinner extends Winner {
  name: string;
  color: string;
}
interface DataBundle {
  cars: Car[];
  winners: Winner[];
}

const carsPerPage = 5;
const winnersPerPage = 10;
const carSize = 50;

class Api {
  async getData(): Promise<DataBundle | null> {
    return getData();
  }
  async start(id: number) {
    return changeEngineStatus(id, "started");
  }
  async stop(id: number) {
    return changeEngineStatus(id, "stopped");
  }
  async drive(id: number, signal?: AbortSignal) {
    const r = await fetch(
      `http://localhost:3000/engine?id=${id}&status=drive`,
      {
        method: "PATCH",
        signal,
      }
    );
    if (!r.ok) throw new Error(await r.text());
  }
  async persistWinner(id: number, time: number) {
    return saveWinner(id, time);
  }
  async sortWins() {
    return sortByWins();
  }
  async sortTime() {
    return sortByTime();
  }
  async create(car: { name: string; color: string }) {
    return createCar(car);
  }
  async update(id: number, patch: { name: string; color: string }) {
    return updateCar(id, patch);
  }
  async removeWinner(id: number) {
    return deleteWinner(id);
  }
  async bulkCreate(cars: CarDto[]) {
    return bulkCreateCars(cars);
  }
  async removeAll(cars: Car[], winners: Winner[]) {
    return deleteAll(cars, winners);
  }
}

class Dom {
  headerBtnGarage = document.getElementById(
    "headerButton1"
  ) as HTMLButtonElement;
  headerBtnWinners = document.getElementById(
    "headerButton2"
  ) as HTMLButtonElement;
  pageGarage = document.querySelector(".firstPage") as HTMLDivElement;
  pageWinners = document.querySelector(".winners") as HTMLDivElement;
  createBtn = document.getElementById("createBtn") as HTMLButtonElement;
  updateBtn = document.getElementById("updateBtn") as HTMLButtonElement;
  generateBtn = document.getElementById("generateCarsBtn") as HTMLButtonElement;
  raceBtn = document.getElementById("raceBtn") as HTMLButtonElement;
  resetBtn = document.getElementById("resetBtn") as HTMLButtonElement;
  createInput = document.getElementById("createInput") as HTMLInputElement;
  updateInput = document.getElementById("updateInput") as HTMLInputElement;
  colorPicker1 = document.getElementById("colorPicker1") as HTMLInputElement;
  colorPicker2 = document.getElementById("colorPicker2") as HTMLInputElement;
  colorBox1 = document.getElementById("colorBox1") as HTMLDivElement;
  colorBox2 = document.getElementById("colorBox2") as HTMLDivElement;
  carsList = document.querySelector(".carsList") as HTMLDivElement;
  carsCount = document.querySelector(".carsCount") as HTMLDivElement;
  btnPrev = document.getElementById("prevPage") as HTMLButtonElement;
  btnNext = document.getElementById("nextPage") as HTMLButtonElement;
  pageNumber = document.getElementById("pageNumber") as HTMLSpanElement;
  winnersCount = document.querySelector(".winnersCount") as HTMLDivElement;
  tableBody = document.querySelector("tbody") as HTMLTableSectionElement;
  btnPrevW = document.getElementById("prevPageWinner") as HTMLButtonElement;
  btnNextW = document.getElementById("nextPageWinner") as HTMLButtonElement;
  winnersSort = document.getElementById("winnersSort") as HTMLButtonElement;
  timeSort = document.getElementById("timeSort") as HTMLButtonElement;
  winnerDisplay = document.querySelector(".winnerDisplay") as HTMLDivElement;
  logInBtn = document.getElementById("logInBtn") as HTMLButtonElement;
  firstPage = document.querySelector(".firstPage") as HTMLDivElement;
  signUp = document.querySelector(".signUp") as HTMLDivElement;
  logIn = document.querySelector(".logIn") as HTMLDivElement;
  logSignUpBtn = document.getElementById("logSignUpBtn") as HTMLButtonElement;
  cancelBtn = document.getElementById("cancelBtn") as HTMLButtonElement;
  signUpBtn = document.getElementById("signUpBtn") as HTMLButtonElement;
  logOut = document.getElementById("logOut") as HTMLButtonElement;
  winners = document.querySelector(".winners") as HTMLDivElement;
  profExBtn = document.getElementById("profExBtn") as HTMLButtonElement;
  profile = document.querySelector(".profile") as HTMLDivElement;
  profBtn = document.getElementById("profBtn") as HTMLButtonElement;
  delAcc = document.getElementById("delAcc") as HTMLButtonElement;
  alertBox = document.querySelector(".alertBox") as HTMLDivElement;
  profileBox = document.querySelector(".profileBox") as HTMLDivElement;
  alertYes = document.getElementById("alertYes") as HTMLButtonElement;
  alertNo = document.getElementById("alertNo") as HTMLButtonElement;
  userNameInput = document.getElementById("userNameInput") as HTMLInputElement;
  userPassInput = document.getElementById("userPassInput") as HTMLInputElement;
  userName = document.getElementById("userName") as HTMLHeadElement;
  userWins = document.getElementById("userWins") as HTMLHeadElement;
  userLoses = document.getElementById("userLoses") as HTMLHeadElement;
  pageNumberWinner = document.getElementById(
    "pageNumberWinner"
  ) as HTMLSpanElement;
  deleteAllCarsBtn = document.getElementById(
    "deleteAllCarsBtn"
  ) as HTMLButtonElement;
  singUpUserNameInput = document.getElementById(
    "singUpUserNameInput"
  ) as HTMLInputElement;
  singUpUserPassInput = document.getElementById(
    "singUpUserPassInput"
  ) as HTMLInputElement;
  overlay = (() => {
    const el = document.createElement("div");
    el.className = "overlay";
    el.textContent = "";
    document.body.appendChild(el);
    return el as HTMLDivElement;
  })();
}

const SVG = {
  car(color: string, size = carSize) {
    return `<svg class="raceTrackCar" width="${size}" height="${size}" viewBox="0 0 640 512" xmlns="http://www.w3.org/2000/svg">
  <path fill="${color}" d="M171.3 96L224 96l0 96-112.7 0 30.4-75.9C146.5 104 158.2 96 171.3 96zM272 192l0-96 81.2 0c9.7 0 18.9 4.4 25 12l67.2 84L272 192zm256.2 1L428.2 68c-18.2-22.8-45.8-36-75-36L171.3 32c-39.3 0-74.6 23.9-89.1 60.3L40.6 196.4C16.8 205.8 0 228.9 0 256L0 368c0 17.7 14.3 32 32 32l33.3 0c7.6 45.4 47.1 80 94.7 80s87.1-34.6 94.7-80l130.7 0c7.6 45.4 47.1 80 94.7 80s87.1-34.6 94.7-80l33.3 0c17.7 0 32-14.3 32-32l0-48c0-65.2-48.8-119-111.8-127zM434.7 368a48 48 0 1 1 90.5 32 48 48 0 1 1 -90.5-32z M160 336a48 48 0 1 1 0 96 48 48 0 1 1 0-96z"/>
  </svg>`;
  },
  flag() {
    return `<svg class="flag" width="50" height="50" viewBox="0 0 640 512" xmlns="http://www.w3.org/2000/svg">
  <path fill="#d20f0f" d="M91.7 96C106.3 86.8 116 70.5 116 52C116 23.3 92.7 0 64 0S12 23.3 12 52c0 16.7 7.8 31.5 20 41l0 3 0 352 0 64 64 0 0-64 373.6 0c14.6 0 26.4-11.8 26.4-26.4c0-3.7-.8-7.3-2.3-10.7L432 272l61.7-138.9c1.5-3.4 2.3-7 2.3-10.7c0-14.6-11.8-26.4-26.4-26.4L91.7 96z"/>
  </svg>`;
  },
};

class LogIn {
  constructor(private dom: Dom, private api: Api) {}
  private garage = new GarageController(this.dom, this.api);
  private winners = new WinnersController(this.dom, this.api);

  init() {
    this.logInAcc();
    this.logInSignUp();
  }

  private logInAcc() {
    (async () => {
      const { user } = await auth.current();
      if (user) {
        this.showMainPage();
      }
    })();

    this.dom.logInBtn.addEventListener("click", async (e) => {
      e.preventDefault();

      const username = this.dom.userNameInput?.value.trim();
      const password = this.dom.userPassInput?.value.trim();

      if (!username || !password) {
        alert("Please enter both username and password.");
        return;
      }

      try {
        await auth.login(username, password);
        this.showMainPage();
      } catch (err) {
        console.error(err);
        alert("Invalid username or password.");
      }
    });
  }

  private showMainPage() {
    this.dom.firstPage.style.display = "flex";
    this.dom.signUp.style.display = "none";
    this.dom.logIn.style.display = "none";
    (async () => {
      const { user } = await auth.current();
      const stats = await getMyStats();
      if (user) {
        const username = user.username ?? null;
        const wins = stats.wins ?? null;
        const loses = stats.losses ?? null;
        this.dom.userName.textContent = `User Name: ${username}`;
        this.dom.userWins.textContent = `Your wins: ${wins}`;
        this.dom.userLoses.textContent = `Your loses: ${loses}`;
      }
    })();
    this.garage.load(1);
    this.winners.load(1);
  }

  private logInSignUp() {
    this.dom.logSignUpBtn.addEventListener("click", () => {
      this.dom.signUp.style.display = "flex";
      this.dom.logIn.style.display = "none";
    });
  }
}

class SignUp {
  constructor(private dom: Dom, private api: Api) {}
  private garage = new GarageController(this.dom, this.api);
  private winners = new WinnersController(this.dom, this.api);

  private showMainPage() {
    this.dom.firstPage.style.display = "flex";
    this.dom.signUp.style.display = "none";
    this.dom.logIn.style.display = "none";
    this.garage.load(1);
    this.winners.load(1);
  }

  init() {
    this.cancel();
    this.signUpAcc();
  }

  private cancel() {
    this.dom.cancelBtn.addEventListener("click", () => {
      this.dom.signUp.style.display = "none";
      this.dom.logIn.style.display = "flex";
    });
  }

  private signUpAcc() {
    this.dom.signUpBtn.addEventListener("click", async (e) => {
      e.preventDefault();

      const username = this.dom.singUpUserNameInput?.value.trim();
      const password = this.dom.singUpUserPassInput?.value.trim();

      if (!username || !password) {
        alert("Please enter username and password.");
        return;
      }

      try {
        await auth.signup(username, password);
        await auth.login(username, password);
        this.showMainPage();
      } catch (err) {
        console.error(err);
        alert("Username already exists or signup failed.");
      }
    });
  }
}

class Profile {
  constructor(private dom: Dom, private api: Api) {}

  init() {
    this.open();
    this.exit();
    this.delProf();
    this.alertYes();
    this.alertNo();
  }

  private open() {
    this.dom.profBtn.addEventListener("click", () => {
      this.dom.profile.style.display = "flex";
    });
  }
  private exit() {
    this.dom.profExBtn.addEventListener("click", () => {
      this.dom.profile.style.display = "none";
    });
  }

  private delProf() {
    this.dom.delAcc.addEventListener("click", () => {
      this.dom.alertBox.style.display = "flex";
      this.dom.profileBox.style.display = "none";
    });
  }

  private alertYes() {
    this.dom.alertYes.addEventListener("click", async () => {
      this.dom.overlay.textContent = "deliting";
      this.dom.overlay.classList.add("show");
      document.body.setAttribute("aria-busy", "true");

      try {
      } finally {
        this.dom.overlay.classList.remove("show");
        document.body.removeAttribute("aria-busy");
      }
      window.location.reload();
      this.dom.profile.style.display = "none";
      this.dom.profileBox.style.display = "none";
      this.dom.alertBox.style.display = "none";
      this.dom.firstPage.style.display = "none";
      this.dom.signUp.style.display = "none";
      this.dom.logIn.style.display = "flex";
    });
  }

  private alertNo() {
    this.dom.alertNo.addEventListener("click", () => {
      this.dom.alertBox.style.display = "none";
      this.dom.profileBox.style.display = "flex";
    });
  }
}

class Paginator {
  #page = 1;
  constructor(
    private prevBtn: HTMLButtonElement,
    private nextBtn: HTMLButtonElement,
    private label: HTMLSpanElement,
    private onChange: (page: number) => void
  ) {
    this.prevBtn.addEventListener("click", () => this.prev());
    this.nextBtn.addEventListener("click", () => this.next());
    this.render();
  }
  get page() {
    return this.#page;
  }
  set page(v: number) {
    this.#page = Math.max(1, v);
    this.render();
    this.onChange(this.#page);
  }
  async next() {
    this.page = this.#page + 1;
  }
  prev() {
    if (this.#page > 1) this.page = this.#page - 1;
  }
  render() {
    this.label.textContent = String(this.#page);
  }
}

class GarageController {
  private allCars: Car[] = [];
  private selectedCarId: number | null = null;
  private _winnerTimeout?: ReturnType<typeof setTimeout>;
  private isDeletingAll = false;
  private suppressWinnerSaves = false;
  private activeDrives = new Map<number, AbortController>();
  private winnerRecorded = false;
  private refreshWinners() {
    window.dispatchEvent(new CustomEvent("winners:refresh"));
  }

  constructor(private dom: Dom, private api: Api) {}

  init() {
    this.bindColorPickers();
    this.bindCrud();
    this.bindRace();
    this.logOut();
  }

  async load(page = 1) {
    const data = await this.api.getData();
    if (!data) return;
    this.allCars = data.cars;
    this.dom.carsCount.innerHTML = `<h1>Garage(${this.allCars.length})</h1>`;
    this.render(page);
  }

  private logOut() {
    this.dom.logOut.addEventListener("click", async () => {
      const btns = document.querySelectorAll(".headerButton");
      this.dom.overlay.textContent = "Exiting…";
      this.dom.overlay.classList.add("show");
      document.body.setAttribute("aria-busy", "true");

      try {
        await this.stopAll();
      } finally {
        this.dom.overlay.classList.remove("show");
        document.body.removeAttribute("aria-busy");
      }
      await auth.logout();
      btns.forEach((b) => b.classList.remove("active"));
      btns[0].classList.add("active");
      this.dom.firstPage.style.display = "none";
      this.dom.signUp.style.display = "none";
      this.dom.winners.style.display = "none";
      this.dom.logIn.style.display = "flex";
    });
  }

  private render(page: number) {
    this.dom.carsList.innerHTML = "";
    const start = (page - 1) * carsPerPage;
    const slice = this.allCars.slice(start, page * carsPerPage);
    slice.forEach((car) => {
      const el = this.createCarElement(car);
      this.setupWorkingButtons(el);
      this.dom.carsList.appendChild(el);
    });
  }

  private createCarElement(car: Car) {
    const el = document.createElement("div");
    el.className = "car";
    el.dataset.id = String(car.id);
    el.innerHTML = `
    <div class="carElementTopSide">
    <button class="btn select">Select</button>
    <p>${car.name}</p>
    </div>
    <button class="workingButton active">Choose</button>
    <div class="raceTrack">
    ${SVG.car(car.color, carSize)}
    ${SVG.flag()}
    </div>`;
    const sel = el.querySelector(".select") as HTMLButtonElement;
    this.onSelect(el, car);
    return el;
  }

  private onSelect(el: HTMLDivElement, car: Car) {
    el.querySelector(".select")?.addEventListener("click", () => {
      this.selectedCarId = car.id;
      this.dom.updateInput.value = car.name;
      this.dom.colorPicker2.value = car.color;
      this.dom.colorBox2.style.backgroundColor = car.color;
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  private bindColorPickers() {
    const sync = (
      picker: HTMLInputElement,
      box: HTMLDivElement,
      fallback: string
    ) => {
      box.style.backgroundColor = picker.value || fallback;
      picker.addEventListener(
        "input",
        () => (box.style.backgroundColor = picker.value)
      );
    };
    sync(this.dom.colorPicker1, this.dom.colorBox1, "#00ff80");
    sync(this.dom.colorPicker2, this.dom.colorBox2, "#00ff80");
  }

  private bindCrud() {
    this.dom.createBtn.addEventListener("click", async () => {
      const name = this.dom.createInput.value.trim();
      const color = this.dom.colorPicker1.value || "#00ff80";
      if (!name) return;

      await this.api.create({ name, color });

      this.dom.createInput.value = "";
      this.dom.colorPicker1.value = "#00ff80";
      this.dom.colorBox1.style.backgroundColor = "#00ff80";

      await this.reloadSamePage();
    });

    this.dom.updateBtn.addEventListener("click", async () => {
      const id = this.selectedCarId;
      if (!id) return;
      const name = this.dom.updateInput.value.trim();
      const color = this.dom.colorPicker2.value || "#00ff80";
      if (!name) return;
      await this.api.update(id, { name, color });
      this.selectedCarId = null;
      this.dom.updateInput.value = "";
      this.dom.colorPicker2.value = "#00ff80";
      this.dom.colorBox2.style.backgroundColor = "#00ff80";
      const c = this.allCars.find((c) => c.id === id);
      if (c) {
        c.name = name;
        c.color = color;
      }
      this.refreshWinners();
      await this.reloadSamePage();
    });

    this.dom.deleteAllCarsBtn.addEventListener("click", async () => {
      if (this.isDeletingAll) return;
      this.isDeletingAll = true;
      this.suppressWinnerSaves = true;
      this.dom.overlay.textContent = "Deleting…";
      this.dom.overlay.classList.add("show");
      document.body.setAttribute("aria-busy", "true");

      try {
        const data = await this.api.getData();
        if (!data) return;

        this.dom.raceBtn.disabled = true;
        this.dom.resetBtn.disabled = true;
        this.dom.createBtn.disabled = true;
        this.dom.updateBtn.disabled = true;
        this.dom.deleteAllCarsBtn.disabled = true;
        this.dom.generateBtn.disabled = true;

        await this.stopAll();

        await this.api.removeAll(data.cars, data.winners);

        const after = await this.api.getData();
        if (after) {
          const leftover = after.winners.filter(
            (w) => !data.winners.some((x) => x.id === w.id)
          );
          if (leftover.length) {
            await Promise.allSettled(
              leftover.map((w) => this.api.removeWinner(w.id))
            );
          }
        }

        this.dom.carsList.innerHTML = "";
        this.dom.tableBody.innerHTML = "";
        this.dom.carsCount.innerHTML = `<h1>Garage(0)</h1>`;
        this.dom.winnersCount.innerHTML = `<h1>Winners(0)</h1>`;

        await this.reloadSamePage();
      } finally {
        this.isDeletingAll = false;
        this.suppressWinnerSaves = false;

        this.dom.raceBtn.disabled = false;
        this.dom.resetBtn.disabled = false;
        this.dom.createBtn.disabled = false;
        this.dom.updateBtn.disabled = false;
        this.dom.deleteAllCarsBtn.disabled = false;
        this.dom.generateBtn.disabled = false;
        this.dom.overlay.classList.remove("show");
        document.body.removeAttribute("aria-busy");
      }
    });

    this.dom.generateBtn.addEventListener("click", async () => {
      const cars = this.generateRandomCars(5);
      await bulkCreateCars(cars);
      await this.reloadSamePage();
    });
  }

  private bindRace() {
    this.dom.raceBtn.addEventListener("click", () => this.raceAll());
    this.dom.resetBtn.addEventListener("click", async () => {
      this.dom.overlay.textContent = "Reseting all cars…";
      this.dom.overlay.classList.add("show");
      document.body.setAttribute("aria-busy", "true");

      try {
        await this.stopAll();
      } finally {
        this.dom.overlay.classList.remove("show");
        document.body.removeAttribute("aria-busy");
      }
    });
  }

  private setupWorkingButtons(el: HTMLElement) {
    const button = el.querySelector(".workingButton") as HTMLButtonElement;

    button.addEventListener("click", () => {
      if (button.classList.contains("active")) {
        button.classList.remove("active");
        button.textContent = "Chosen";
      } else {
        button.classList.add("active");
        button.textContent = "Choose";
      }
    });
  }

  private async startEngine(id: number, svg: SVGElement) {
    if (this.isDeletingAll) return;

    const html = svg as unknown as HTMLElement;
    const track = html.closest(".raceTrack") as HTMLElement;

    const res = await this.api.start(id);
    if (!res) return;

    html.style.transition = "none";
    html.style.transform = "translateX(0)";
    void html.offsetWidth;

    const maxX = track.clientWidth - 50 - 10;
    html.style.transition = `transform 3s linear`;
    html.style.transform = `translateX(${maxX}px)`;

    const t0 = performance.now();
    const ctrl = new AbortController();
    this.activeDrives.set(id, ctrl);

    try {
      await this.api.drive(id, ctrl.signal);
      const timeSec = (performance.now() - t0) / 1000;

      if (!this.winnerRecorded && !this.suppressWinnerSaves) {
        this.winnerRecorded = true;
        const car = this.allCars.find((c) => c.id === id);
        const label = car?.name ?? `#${id}`;
        await this.api.persistWinner(id, timeSec);
        this.showWinner(label, timeSec);
        this.refreshWinners();
      }
    } catch {
      const matrix = new DOMMatrixReadOnly(getComputedStyle(html).transform);
      html.style.transition = "none";
      html.style.transform = `translateX(${matrix.m41}px)`;
    } finally {
      this.activeDrives.delete(id);
    }
  }

  private async stopEngine(id: number, svg: SVGElement) {
    const html = svg as unknown as HTMLElement;

    const ctrl = this.activeDrives.get(id);
    if (ctrl) ctrl.abort();

    html.style.transition = "transform 0.5s ease-out";
    html.style.transform = "translateX(0px)";
    await this.api.stop(id);
  }

  private async raceAll() {
    if (this.isDeletingAll) return;
    this.winnerRecorded = false;
    const cards = this.dom.carsList.querySelectorAll(
      "[data-id]"
    ) as NodeListOf<HTMLElement>;
    for (const el of Array.from(cards)) {
      const id = +el.dataset.id!;
      const svg = el.querySelector(".raceTrackCar") as SVGElement;
      this.startEngine(id, svg);
    }
  }

  private async stopAll() {
    const cards = this.dom.carsList.querySelectorAll(
      "[data-id]"
    ) as NodeListOf<HTMLElement>;

    for (const el of Array.from(cards)) {
      const id = +el.dataset.id!;
      const ctrl = this.activeDrives.get(id);
      if (ctrl) ctrl.abort();
    }
    for (const el of Array.from(cards)) {
      const id = +el.dataset.id!;
      const svg = el.querySelector(".raceTrackCar") as SVGElement;
      const winnerAlert = document.querySelector(".winnerAlert") as HTMLElement;
      if (winnerAlert) winnerAlert.remove();
      await this.stopEngine(id, svg);
    }
  }

  private showWinner(name: string, time: number) {
    const el = this.dom.winnerDisplay;
    el.innerHTML = `<h1 class="winnerAlert">Winner ${name} — ${time.toFixed(
      2
    )}s</h1>`;
    el.classList.add("visible");
    clearTimeout(this._winnerTimeout);
    this._winnerTimeout = setTimeout(
      () => el.classList.remove("visible"),
      2500
    );
  }

  private generateRandomCars(
    n: number
  ): Array<{ name: string; color: string }> {
    const names = [
      "Tesla",
      "BMW",
      "Audi",
      "Ferrari",
      "Lambo",
      "Porsche",
      "Nissan",
      "Toyota",
      "Ford",
      "Chevy",
      "Honda",
      "Kia",
    ];
    const colors = [
      "#ff0000",
      "#00ff00",
      "#0000ff",
      "#ff00ff",
      "#00ffff",
      "#ffff00",
      "#ffaa00",
      "#00ffaa",
      "#aa00ff",
      "#ff0066",
    ];
    const cars: Array<{ name: string; color: string }> = [];
    for (let i = 0; i < n; i++) {
      const name = `${names[(Math.random() * names.length) | 0]} ${
        (Math.random() * 900 + 100) | 0
      }`;
      const color = colors[(Math.random() * colors.length) | 0];
      cars.push({ name, color });
    }
    return cars;
  }

  private async reloadSamePage() {
    const page = Number(this.dom.pageNumber.textContent || 1);
    await this.load(page);
  }
}

class WinnersController {
  private allWinners: ExtendedWinner[] = [];

  constructor(private dom: Dom, private api: Api) {}

  init() {
    this.dom.winnersSort.addEventListener("click", () => this.toggleWinsSort());
    this.dom.timeSort.addEventListener("click", () => this.toggleTimeSort());
  }

  private extendWithCars(winners: Winner[], cars: Car[]): ExtendedWinner[] {
    return winners.map((w) => {
      const car = cars.find((c) => c.id === w.id);
      return {
        ...w,
        name: car?.name || "Unknown",
        color: car?.color || "#ccc",
      };
    });
  }

  async load(page = 1) {
    const data = await this.api.getData();
    if (!data) return;
    this.allWinners = this.extendWithCars(data.winners, data.cars);
    this.dom.winnersCount.innerHTML = `<h1>Winners(${this.allWinners.length})</h1>`;
    this.render(page);
  }

  private render(page: number) {
    this.dom.tableBody.innerHTML = "";
    const start = (page - 1) * winnersPerPage;
    const slice = this.allWinners.slice(start, page * winnersPerPage);
    slice.forEach((w, i) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
  <td>${start + i + 1}</td>
  <td>${SVG.car(w.color, 30)}</td>
  <td>${w.name}</td>
  <td>${w.wins}</td>
  <td>${w.time.toFixed(2)}</td>`;
      this.dom.tableBody.appendChild(tr);
    });
  }

  private setSortArrow(
    btn: HTMLButtonElement,
    dir: "asc" | "desc",
    col: string
  ) {
    btn.classList.remove("up", "down");
    btn.classList.add(dir === "asc" ? "up" : "down");
    btn.innerHTML =
      dir === "asc"
        ? `${
            col === "wins" ? "Wins" : "Best time (seconds)"
          } <svg class="arrow" width="16px" height="16px" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 5H3L3 16H5L5 5L8 5V4L4 0L0 4V5Z" fill="#000000"/>
        <path d="M16 16H10V14H16V16Z" fill="#000000"/>
        <path d="M10 12H14V10H10V12Z" fill="#000000"/>
        <path d="M12 8H10V6H12V8Z" fill="#000000"/>
      </svg>`
        : `${
            col === "wins" ? "Wins" : "Best time (seconds)"
          } <svg class="arrow" width="16px" height="16px" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 11H3L3 0H5L5 11H8V12L4 16L0 12V11Z" fill="#000000"/>
        <path d="M16 0H10V2H16V0Z" fill="#000000"/>
        <path d="M10 4H14V6H10V4Z" fill="#000000"/>
        <path d="M12 8H10V10H12V8Z" fill="#000000"/>
      </svg>`;
  }

  private async toggleWinsSort() {
    const newDir = this.dom.winnersSort.classList.contains("up")
      ? "desc"
      : "asc";
    this.setSortArrow(this.dom.winnersSort, newDir, "wins");
    const data = await this.api.getData();
    const sorted = await this.api.sortWins();
    if (!data || !sorted) return;
    const source: Winner[] =
      newDir === "asc" ? sorted.ascWins : sorted.descWins;
    this.allWinners = this.extendWithCars(source, data.cars);
    this.render(Number(this.dom.pageNumberWinner.textContent || 1));
  }

  private async toggleTimeSort() {
    const newDir = this.dom.timeSort.classList.contains("up") ? "desc" : "asc";
    this.setSortArrow(this.dom.timeSort, newDir, "time");
    const data = await this.api.getData();
    const sorted = await this.api.sortTime();
    if (!data || !sorted) return;
    const source: Winner[] =
      newDir === "asc" ? sorted.ascTime : sorted.descTime;
    this.allWinners = this.extendWithCars(source, data.cars);
    this.render(Number(this.dom.pageNumberWinner.textContent || 1));
  }
}

class App {
  private api = new Api();
  private dom = new Dom();
  private logIn = new LogIn(this.dom, this.api);
  private signUp = new SignUp(this.dom, this.api);
  private profile = new Profile(this.dom, this.api);
  private garage = new GarageController(this.dom, this.api);
  private winners = new WinnersController(this.dom, this.api);
  private garagePager!: Paginator;
  private winnersPager!: Paginator;

  async init() {
    this.setupHeaderSwitching();
    this.garage.init();
    this.winners.init();
    this.logIn.init();
    this.signUp.init();
    this.profile.init();

    this.garagePager = new Paginator(
      this.dom.btnPrev,
      this.dom.btnNext,
      this.dom.pageNumber,
      (p) => this.garage.load(p)
    );
    this.winnersPager = new Paginator(
      this.dom.btnPrevW,
      this.dom.btnNextW,
      this.dom.pageNumberWinner,
      (p) => this.winners.load(p)
    );

    const { user } = await auth.current();
    if (!user) {
      this.dom.firstPage.style.display = "none";
      this.dom.logIn.style.display = "flex";
      this.dom.signUp.style.display = "flex";
      return;
    }

    this.garage.load(1);
    this.winners.load(1);

    this.dom.colorBox1.style.backgroundColor =
      this.dom.colorPicker1.value || "#00ff80";
    this.dom.colorBox2.style.backgroundColor =
      this.dom.colorPicker2.value || "#00ff80";

    window.addEventListener("winners:refresh", () => {
      this.winners.load(this.winnersPager.page);
    });
  }

  private setupHeaderSwitching() {
    const first = this.dom.pageGarage;
    const winners = this.dom.pageWinners;
    document.querySelectorAll(".headerButton").forEach((btn) => {
      btn.addEventListener("click", () => {
        document
          .querySelectorAll(".headerButton")
          .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        if (btn === this.dom.headerBtnGarage) {
          first.style.display = "block";
          winners.style.display = "none";
        } else {
          first.style.display = "none";
          winners.style.display = "block";
        }
      });
    });
  }
}

new App().init();
