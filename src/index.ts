import "./style.css";
import {
  getData,
  changeEngineStatus,
  saveWinner,
  sortByWins,
  sortByTime,
  createCar,
  updateCar,
  deleteCar,
  deleteWinner,
  bulkCreateCars,
  deleteAll,
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

const carsPerPage = 7;
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
  async create(car: CarDto) {
    return createCar(car);
  }
  async update(id: number, patch: { name: string; color: string }) {
    return updateCar(id, patch);
  }
  async remove(id: number) {
    return deleteCar(id);
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
  deleteAllCarsBtn = document.getElementById(
    "deleteAllCarsBtn"
  ) as HTMLButtonElement;
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
  pageNumberWinner = document.getElementById(
    "pageNumberWinner"
  ) as HTMLSpanElement;
  winnersSort = document.getElementById("winnersSort") as HTMLButtonElement;
  timeSort = document.getElementById("timeSort") as HTMLButtonElement;
  winnerDisplay = document.querySelector(".winnerDisplay") as HTMLDivElement;
  deletingOverlay = (() => {
    const el = document.createElement("div");
    el.className = "overlay-deleting";
    el.textContent = "Deleting…";
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
  next() {
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

  constructor(private dom: Dom, private api: Api) {}

  init() {
    this.bindColorPickers();
    this.bindCrud();
    this.bindRace();
  }

  async load(page = 1) {
    const data = await this.api.getData();
    if (!data) return;
    this.allCars = data.cars;
    this.dom.carsCount.innerHTML = `<h1>Garage(${this.allCars.length})</h1>`;
    this.render(page);
  }

  private render(page: number) {
    this.dom.carsList.innerHTML = "";
    const start = (page - 1) * carsPerPage;
    const slice = this.allCars.slice(start, page * carsPerPage);
    slice.forEach((car) => {
      const el = this.createCarElement(car);
      this.setupWorkingButtons(
        el,
        car.id,
        el.querySelector(".raceTrackCar") as SVGElement
      );
      this.dom.carsList.appendChild(el);
    });
  }

  private createCarElement(car: Car) {
    const el = document.createElement("div");
    el.className = "car";
    el.dataset.id = String(car.id);
    el.innerHTML = `
    <div class="carControls">
    <button class="btn select">Select</button>
    <button class="btn remove">Remove</button>
    </div>
    <div class="carTitle">${car.name}</div>
    <div class="workingButtons">
    <button class="workingButton active">A</button>
    <button class="workingButton" disabled>B</button>
    </div>
    <div class="raceTrack">
    ${SVG.car(car.color, carSize)}
    ${SVG.flag()}
    </div>`;
    const sel = el.querySelector(".select") as HTMLButtonElement;
    const rem = el.querySelector(".remove") as HTMLButtonElement;
    sel.addEventListener("click", () => this.onSelect(car));
    rem.addEventListener("click", async () => {
      await this.api.remove(car.id);
      await this.reloadSamePage();
    });
    return el;
  }

  private onSelect(car: Car) {
    this.selectedCarId = car.id;
    this.dom.updateInput.value = car.name;
    this.dom.colorPicker2.value = car.color;
    this.dom.colorBox2.style.backgroundColor = car.color;
    window.scrollTo({ top: 0, behavior: "smooth" });
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
      const nextId = this.allCars.length
        ? this.allCars[this.allCars.length - 1].id + 1
        : 1;
      await this.api.create({ id: nextId, name, color });
      this.dom.createInput.value = "";
      this.dom.colorPicker1.value = "#00ff80";
      this.dom.colorBox1.style.backgroundColor = "#00ff80";
      await this.reloadSamePage();
    });

    this.dom.updateBtn.addEventListener("click", async () => {
      if (!this.selectedCarId) return;
      const name = this.dom.updateInput.value.trim();
      const color = this.dom.colorPicker2.value || "#00ff80";
      if (!name) return;
      await this.api.update(this.selectedCarId, { name, color });
      this.selectedCarId = null;
      this.dom.updateInput.value = "";
      this.dom.colorPicker2.value = "#00ff80";
      this.dom.colorBox2.style.backgroundColor = "#00ff80";
      await this.reloadSamePage();
    });

    this.dom.deleteAllCarsBtn.addEventListener("click", async () => {
      if (this.isDeletingAll) return;
      this.isDeletingAll = true;
      this.suppressWinnerSaves = true;
      this.dom.deletingOverlay.classList.add("show");
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
        this.dom.deletingOverlay.classList.remove("show");
        document.body.removeAttribute("aria-busy");
      }
    });

    this.dom.generateBtn.addEventListener("click", async () => {
      const cars = this.generateRandomCars(7);
      await this.api.bulkCreate(cars);
      await this.reloadSamePage();
    });
  }

  private bindRace() {
    this.dom.raceBtn.addEventListener("click", () => this.raceAll());
    this.dom.resetBtn.addEventListener("click", () => this.stopAll());
  }

  private setupWorkingButtons(el: HTMLElement, carId: number, svg: SVGElement) {
    const buttons = el.querySelectorAll(
      ".workingButton"
    ) as NodeListOf<HTMLButtonElement>;
    const buttonA = buttons[0];
    const buttonB = buttons[1];

    const setUI = (aActive: boolean) => {
      if (aActive) {
        buttonB.classList.add("active");
        buttonA.classList.remove("active");
        buttonA.disabled = true;
        buttonB.disabled = false;
      } else {
        buttonA.classList.add("active");
        buttonB.classList.remove("active");
        buttonB.disabled = true;
        buttonA.disabled = false;
      }
    };

    buttonA.addEventListener("click", async () => {
      if (buttonB.classList.contains("active")) return;
      setUI(true);
      await this.startEngine(carId, svg);
    });

    buttonB.addEventListener("click", async () => {
      if (buttonA.classList.contains("active")) return;
      setUI(false);
      await this.stopEngine(carId, svg);
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

      if (!this.suppressWinnerSaves) {
        await this.api.persistWinner(id, timeSec);
        this.showWinner(id, timeSec);
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
      await this.stopEngine(id, svg);
    }
  }

  private showWinner(id: number, time: number) {
    const el = this.dom.winnerDisplay;
    el.innerHTML = `<span>Winner car #${id} — ${time.toFixed(2)}s</span>`;
    el.classList.add("visible");
    clearTimeout(this._winnerTimeout);
    this._winnerTimeout = setTimeout(
      () => el.classList.remove("visible"),
      2500
    );
  }

  private generateRandomCars(n: number): CarDto[] {
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
    let id = this.allCars.length
      ? this.allCars[this.allCars.length - 1].id + 1
      : 1;
    const cars: CarDto[] = [];
    for (let i = 0; i < n; i++) {
      const name = `${names[Math.floor(Math.random() * names.length)]} ${
        Math.floor(Math.random() * 900) + 100
      }`;
      const color = colors[Math.floor(Math.random() * colors.length)];
      cars.push({ id: id++, name, color });
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

  private setSortArrow(btn: HTMLButtonElement, dir: "asc" | "desc") {
    btn.classList.remove("up", "down");
    btn.classList.add(dir === "asc" ? "up" : "down");
  }

  private async toggleWinsSort() {
    const newDir = this.dom.winnersSort.classList.contains("up")
      ? "desc"
      : "asc";
    this.setSortArrow(this.dom.winnersSort, newDir);
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
    this.setSortArrow(this.dom.timeSort, newDir);
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
  private garage = new GarageController(this.dom, this.api);
  private winners = new WinnersController(this.dom, this.api);
  private garagePager!: Paginator;
  private winnersPager!: Paginator;

  init() {
    this.setupHeaderSwitching();
    this.garage.init();
    this.winners.init();

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

    this.garage.load(1);
    this.winners.load(1);

    this.dom.colorBox1.style.backgroundColor =
      this.dom.colorPicker1.value || "#00ff80";
    this.dom.colorBox2.style.backgroundColor =
      this.dom.colorPicker2.value || "#00ff80";
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
