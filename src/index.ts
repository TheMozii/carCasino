import "./style.css";
import {
  getData,
  changeEngineStatus,
  saveWinner,
  sortByWins,
  sortByTime,
} from "./api";

document.body.innerHTML = `
<header>
  <button id="headerButton1" class="headerButton active">TO GARAGE</button>
  <button id="headerButton2" class="headerButton">TO WINNERS</button>
</header>
<div class="firstPage">
  <div class="winnerDisplay"></div>
  <div class="topNavigation">
    <div class="topNavigationInputs">
      <input type="text" class="input" id="createInput" placeholder="Type here..." />
      <div class="color-wrapper">
        <div id="colorBox1" class="colorBox"></div>
        <input type="color" id="colorPicker1" />
      </div>
      <button class="btn" id="createBtn">CREATE</button>
    </div>
    <div class="topNavigationInputs">
      <input type="text" class="input" id="updateInput" placeholder="Type here..." />
      <div class="color-wrapper">
        <div id="colorBox2" class="colorBox"></div>
        <input type="color" id="colorPicker2" />
      </div>
      <button class="btn" id="updateBtn">UPDATE</button>
    </div>
    <div class="topNavigationBottomBtn">
      <button class="btn" id="raceBtn">RACE</button>
      <button class="btn" id="resetBtn">RESET</button>
      <button class="btn" id="generateCarsBtn">GEN</button>
      <button class="btn" id="deleteAllCarsBtn">DEL</button>
    </div>
  </div>
  <div class="garage">
    <div class="carsCount"></div>
    <div class="carsList"></div>
    <div class="pagination">
      <button id="prevPage" class="btn">Prev</button>
      <span id="pageNumber">1</span>
      <button id="nextPage" class="btn">Next</button>
    </div>
  </div>
</div>
<div class="winners" style="display: none">
  <div class="winnersCount"></div>
  <table>
    <thead>
      <tr>
        <th>Number</th>
        <th>Car</th>
        <th>Name</th>
        <th><button class="sortBtn" id="winnersSort">Wins</button></th>
        <th><button class="sortBtn" id="timeSort">Best time (seconds)</button></th>
      </tr>
    </thead>
    <tbody></tbody>
  </table>
  <div class="pagination">
    <button id="prevPageWinner" class="btn">Prev</button>
    <span id="pageNumberWinner">1</span>
    <button id="nextPageWinner" class="btn">Next</button>
  </div>
</div>
`;

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

const carsPerPage = 7;
const winnersPerPage = 10;
const delayTime = 10;
const oneSecond = 1000;
const sixtyPx = 60;
const randomCarAmount = 7;
const two = 2;
const carSize = 50;
let allCars: Car[] = [];
let allWinners: ExtendedWinner[] = [];
let currentPage = 1;
let currentWinnersPage = 1;
let selectedCarId: number | null = null;
const getNextId = (): number =>
  allCars.length ? allCars[allCars.length - 1].id + 1 : 1;

const UI = {
  carsList: document.querySelector(".carsList") as HTMLDivElement,
  carsCount: document.querySelector(".carsCount") as HTMLDivElement,
  pageNumber: document.getElementById("pageNumber") as HTMLSpanElement,
  winnersCount: document.querySelector(".winnersCount") as HTMLDivElement,
  tableBody: document.querySelector("tbody") as HTMLTableSectionElement,
  pageNumberWinner: document.getElementById(
    "pageNumberWinner"
  ) as HTMLSpanElement,
  createBtn: document.getElementById("createBtn") as HTMLButtonElement,
  updateBtn: document.getElementById("updateBtn") as HTMLButtonElement,
  generateBtn: document.getElementById("generateCarsBtn") as HTMLButtonElement,
  deleteAllCarsBtn: document.getElementById(
    "deleteAllCarsBtn"
  ) as HTMLButtonElement,
  raceBtn: document.getElementById("raceBtn") as HTMLButtonElement,
  resetBtn: document.getElementById("resetBtn") as HTMLButtonElement,
  createInput: document.getElementById("createInput") as HTMLInputElement,
  updateInput: document.getElementById("updateInput") as HTMLInputElement,
  colorPicker1: document.getElementById("colorPicker1") as HTMLInputElement,
  colorPicker2: document.getElementById("colorPicker2") as HTMLInputElement,
  colorBox1: document.getElementById("colorBox1") as HTMLDivElement,
  colorBox2: document.getElementById("colorBox2") as HTMLDivElement,
  winnerDisplay: document.querySelector(".winnerDisplay") as HTMLDivElement,
  winnersSort: document.getElementById("winnersSort") as HTMLButtonElement,
  timeSort: document.getElementById("timeSort") as HTMLButtonElement,
};

const setupPageSwitching = () => {
  const first = document.querySelector(".firstPage") as HTMLDivElement;
  const winners = document.querySelector(".winners") as HTMLDivElement;
  document.querySelectorAll(".headerButton").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".headerButton")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      first.style.display = btn.id === "headerButton1" ? "flex" : "none";
      winners.style.display = btn.id === "headerButton2" ? "flex" : "none";
    });
  });
};

const setupColorPickers = () => {
  [
    ["colorBox1", "colorPicker1"],
    ["colorBox2", "colorPicker2"],
  ].forEach(([boxId, pickerId]) => {
    const box = document.getElementById(boxId)! as HTMLDivElement;
    const picker = document.getElementById(pickerId)! as HTMLInputElement;
    picker.value = "#00ff80";
    box.addEventListener("click", () => picker.click());
    picker.addEventListener("input", () => {
      box.style.backgroundColor = picker.value;
    });
  });
};

const setupPaginate = (
  prevId: string,
  nextId: string,
  get: () => number,
  set: (v: number) => void,
  render: (page: number) => void,
  total: () => number,
  perPage: number
) => {
  const prev = document.getElementById(prevId) as HTMLButtonElement;
  const next = document.getElementById(nextId) as HTMLButtonElement;
  prev.addEventListener(
    "click",
    () => get() > 1 && (set(get() - 1), render(get()))
  );
  next.addEventListener(
    "click",
    () =>
      get() < Math.ceil(total() / perPage) && (set(get() + 1), render(get()))
  );
};

const debounce = <T extends (...args: unknown[]) => void>(
  func: T,
  delay: number
): T => {
  let timeout: ReturnType<typeof setTimeout>;
  return function debounced(...args: Parameters<T>) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  } as T;
};

const stopAllCars = async () => {
  const cars = Array.from(document.querySelectorAll(".raceTrackCar"));

  await Promise.all(
    cars.map(async (car) => {
      const html = car as HTMLElement;
      const carContainer = html.closest("[data-id]") as HTMLElement | null;
      if (!carContainer) return;

      const buttons = carContainer.querySelectorAll(
        ".workingButton"
      ) as NodeListOf<HTMLButtonElement>;
      const [buttonA, buttonB] = buttons;

      buttonA.classList.add("active");
      buttonB.classList.remove("active");
      buttonA.disabled = false;
      buttonB.disabled = true;

      html.style.transition = "none";
      html.style.transform = "translateX(0)";

      const id = carContainer.getAttribute("data-id");
      if (id) {
        await changeEngineStatus(Number(id), "stopped");
      }
    })
  );
};

const setupResizeHandler = () => {
  window.addEventListener("resize", debounce(stopAllCars, delayTime));
};

const extendWinnersWithCarData = (
  winners: Winner[],
  cars: Car[]
): ExtendedWinner[] =>
  winners.map((winner) => {
    const car = cars.find((c) => c.id === winner.id);
    return {
      ...winner,
      name: car?.name || "Unknown",
      color: car?.color || "#ccc",
    };
  });

const getCarSvg = (
  color: string,
  size: number
): string => `<svg class="raceTrackCar" 
width="${size}" height="${size}" 
  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512">
  <path fill="${color}" d="M171.3 96L224 96l0 96-112.7 0 30.4-75.9C146.5 104 158.2 96 171.3 96z
    M272 192l0-96 81.2 0c9.7 0 18.9 4.4 25 12l67.2 84L272 192zm256.2 1L428.2 68
    c-18.2-22.8-45.8-36-75-36L171.3 32c-39.3 0-74.6 23.9-89.1 60.3L40.6 196.4C16.8 205.8
    0 228.9 0 256L0 368c0 17.7 14.3 32 32 32l33.3 0c7.6 45.4 47.1 80 94.7 80s87.1-34.6
    94.7-80l130.7 0c7.6 45.4 47.1 80 94.7 80s87.1-34.6 94.7-80l33.3 0c17.7 0 32-14.3 32-32
    l0-48c0-65.2-48.8-119-111.8-127zM434.7 368a48 48 0 1 1 90.5 32 48 48 0 1 1 -90.5-32z
    M160 336a48 48 0 1 1 0 96 48 48 0 1 1 0-96z"/>
</svg>`;

const getFlagSvg = (): string => `<svg class="flag" width="50" height="50" 
  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512">
  <path fill="#d20f0f" d="M91.7 96C106.3 86.8 116 70.5 116 52C116 23.3 92.7 0 64 0S12 23.3 12 52
    c0 16.7 7.8 31.5 20 41l0 3 0 352 0 64 64 0 0-64 373.6 0c14.6 0 26.4-11.8 26.4-26.4
    c0-3.7-.8-7.3-2.3-10.7L432 272l61.7-138.9c1.5-3.4 2.3-7 2.3-10.7c0-14.6-11.8-26.4-26.4-26.4L91.7 96z"/>
</svg>`;

const renderWinners = (page: number) => {
  UI.tableBody.innerHTML = "";
  const startIndex = (page - 1) * winnersPerPage;
  const winners = allWinners.slice(startIndex, page * winnersPerPage);

  winners.forEach((w, i) => {
    const row = document.createElement("tr");
    row.innerHTML = `
    <td>${startIndex + i + 1}</td>
    <td>
    <svg class="car-icon" width="30" height="30" viewBox="0 0 640 512" xmlns="http://www.w3.org/2000/svg">
          <path fill="${
            w.color
          }" d="M171.3 96L224 96l0 96-112.7 0 30.4-75.9C146.5 
          104 158.2 96 171.3 96zM272 192l0-96 81.2 0c9.7 0 18.9 4.4 
          25 12l67.2 84L272 192zm256.2 1L428.2 68c-18.2-22.8-45.8-36-75-36L171.3 
          32c-39.3 0-74.6 23.9-89.1 60.3L40.6 196.4C16.8 205.8 0 228.9 0 256L0 
          368c0 17.7 14.3 32 32 32l33.3 0c7.6 45.4 47.1 80 94.7 80s87.1-34.6 
          94.7-80l130.7 0c7.6 45.4 47.1 80 94.7 80s87.1-34.6 94.7-80l33.3 0c17.7 
          0 32-14.3 32-32l0-48c0-65.2-48.8-119-111.8-127zM434.7 368a48 48 0 1 1 
          90.5 32 48 48 0 1 1 -90.5-32zM160 336a48 48 0 1 1 0 96 48 48 0 1 1 0-96z"/>
        </svg>
    </td>
    <td>${w.name}</td>
    <td>${w.wins}</td>
    <td>${w.time}</td>
    `;

    UI.tableBody.appendChild(row);
  });
  UI.pageNumberWinner.textContent = String(currentWinnersPage);
};

const loadWinners = async () => {
  const data = await getData();
  if (!data) return;

  allWinners = extendWinnersWithCarData(data.winners, data.cars);

  UI.winnersCount.innerHTML = `<h1>Winners(${allWinners.length})</h1>`;
  renderWinners(currentWinnersPage);
};

const startEngine = async (id: number, svg: SVGElement) => {
  const html = svg as unknown as HTMLElement;
  const track = svg.closest(".raceTrack") as HTMLElement;
  const res = await changeEngineStatus(id, "started");
  if (!res) return;

  const time = res.distance / res.velocity / oneSecond;
  const maxX = track.offsetWidth - sixtyPx;

  html.style.transition = "none";
  html.style.transform = "translateX(0px)";
  void html.offsetWidth;
  html.style.transition = `transform ${time}s linear`;
  html.style.transform = `translateX(${maxX}px)`;

  try {
    const driveResponse = await fetch(
      `http://localhost:3000/engine?id=${id}&status=drive`,
      {
        method: "PATCH",
      }
    );

    if (!driveResponse.ok) throw new Error(await driveResponse.text());
  } catch {
    const computedStyle = window.getComputedStyle(html);
    const matrix = new DOMMatrixReadOnly(computedStyle.transform);
    const currentX = matrix.m41;
    html.style.transition = "none";
    html.style.transform = `translateX(${currentX}px)`;
  }
};

const stopEngine = async (id: number, svg: SVGElement) => {
  const html = svg as unknown as HTMLElement;
  html.style.transition = "transform 0.5s ease-out";
  html.style.transform = "translateX(0px)";
  await changeEngineStatus(id, "stopped");
};

const setupWorkingButtons = (
  el: HTMLElement,
  carId: number,
  svg: SVGElement
) => {
  const buttons = el.querySelectorAll(
    ".workingButton"
  ) as NodeListOf<HTMLButtonElement>;
  const buttonA = buttons[0];
  const buttonB = buttons[1];
  buttonA.classList.add("active");
  buttonB.disabled = true;

  buttonA.addEventListener("click", async () => {
    if (buttonB.classList.contains("active")) return;
    buttonB.classList.add("active");
    buttonA.classList.remove("active");
    buttonA.disabled = true;
    buttonB.disabled = false;
    await startEngine(carId, svg);
  });

  buttonB.addEventListener("click", async () => {
    if (buttonA.classList.contains("active")) return;
    buttonA.classList.add("active");
    buttonB.classList.remove("active");
    buttonB.disabled = true;
    buttonA.disabled = false;
    await stopEngine(carId, svg);
  });
};

const renderCars = (page: number) => {
  UI.carsList.innerHTML = "";
  const cars = allCars.slice((page - 1) * carsPerPage, page * carsPerPage);
  cars.forEach((car) => {
    const el = createCarElement(car);
    setupWorkingButtons(
      el,
      car.id,
      el.querySelector(".raceTrackCar") as SVGElement
    );
    UI.carsList.appendChild(el);
  });
  UI.pageNumber.textContent = String(currentPage);
};

const setupPagination = () => {
  setupPaginate(
    "prevPage",
    "nextPage",
    () => currentPage,
    (v) => {
      currentPage = v;
    },
    renderCars,
    () => allCars.length,
    carsPerPage
  );
  setupPaginate(
    "prevPageWinner",
    "nextPageWinner",
    () => currentWinnersPage,
    (v) => {
      currentWinnersPage = v;
    },
    renderWinners,
    () => allWinners.length,
    winnersPerPage
  );
};

const loadCars = async () => {
  const data = await getData();
  if (!data) return;
  allCars = data.cars;
  UI.carsCount.innerHTML = `<h1>Garage(${allCars.length})</h1>`;
  renderCars(currentPage);
};

const deleteCar = async (id: number) => {
  await fetch(`http://localhost:3000/garage/${id}`, { method: "DELETE" });
  await fetch(`http://localhost:3000/winners/${id}`, { method: "DELETE" });
};

const deleteAllCars = async () => {
  await stopAllCars();

  const [carsRes, winnersRes] = await Promise.all([
    fetch("http://localhost:3000/garage"),
    fetch("http://localhost:3000/winners"),
  ]);

  if (!carsRes.ok) {
    console.error("Failed to load cars:", carsRes.status, await carsRes.text());
    return;
  }

  const cars: Car[] = await carsRes.json();
  const winners: Winner[] = winnersRes.ok ? await winnersRes.json() : [];

  await Promise.all(
    cars.map(async (c) => {
      const r = await fetch(`http://localhost:3000/garage/${Number(c.id)}`, {
        method: "DELETE",
      });
      if (!r.ok)
        console.error("Car DELETE failed:", c.id, r.status, await r.text());
    })
  );

  await Promise.all(
    winners.map(async (w) => {
      const r = await fetch(`http://localhost:3000/winners/${Number(w.id)}`, {
        method: "DELETE",
      });
      if (!r.ok)
        console.error("Winner DELETE failed:", w.id, r.status, await r.text());
    })
  );

  selectedCarId = null;
  currentPage = 1;
  currentWinnersPage = 1;
  UI.updateInput.value = "";
  UI.colorPicker2.value = "#00ff80";
  UI.colorBox2.style.backgroundColor = "#00ff80";
  document.querySelector(".winnerAlert")?.remove();

  allCars = [];
  allWinners = [];
  UI.carsList.innerHTML = "";
  UI.tableBody.innerHTML = "";
  UI.carsCount.innerHTML = "<h1>Garage(0)</h1>";
  UI.winnersCount.innerHTML = "<h1>Winners(0)</h1>";

  await loadCars();
  await loadWinners();
};

const createCarElement = (car: Car): HTMLDivElement => {
  const el = document.createElement("div");
  el.setAttribute("data-id", String(car.id));

  el.innerHTML = `
    <div class="carElementTopSide">
      <button class="btn select">SELECT</button>
      <button class="btn remove">REMOVE</button>
      <p>${car.name}</p>
    </div>
    <div class="workingButtons">
      <button class="workingButton">A</button>
      <button class="workingButton">B</button>
    </div>
    <div class="raceTrack">
      ${getCarSvg(car.color, carSize)}
      ${getFlagSvg()}
    </div>`;

  setupCarButtons(el, car);
  return el;
};

const setupCarButtons = (el: HTMLDivElement, car: Car) => {
  el.querySelector(".remove")?.addEventListener("click", async () => {
    await deleteCar(car.id);
    await loadCars();
    await loadWinners();
  });

  el.querySelector(".select")?.addEventListener("click", () => {
    selectedCarId = car.id;
    UI.updateInput.value = car.name;
    UI.colorPicker2.value = car.color;
    UI.colorBox2.style.backgroundColor = car.color;
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
};

const setupDeleteAllCarsListener = () => {
  UI.deleteAllCarsBtn.addEventListener("click", async () => {
    await deleteAllCars();
  });
};

const setupCreateCarListener = () => {
  UI.createBtn.addEventListener("click", async () => {
    const name = UI.createInput.value.trim();
    const color = UI.colorPicker1.value;
    if (!name) return;

    await fetch("http://localhost:3000/garage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: getNextId(), name, color }),
    });

    UI.createInput.value = "";
    UI.colorPicker1.value = "#00ff80";
    UI.colorBox1.style.backgroundColor = "#00ff80";
    await loadCars();
  });
};

const setupUpdateCarListener = () => {
  UI.updateBtn.addEventListener("click", async () => {
    if (!selectedCarId) return;

    const name = UI.updateInput.value.trim();
    const color = UI.colorPicker2.value;
    if (!name) return;

    await fetch(`http://localhost:3000/garage/${selectedCarId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, color }),
    });

    selectedCarId = null;
    UI.updateInput.value = "";
    UI.colorPicker2.value = "#00ff80";
    UI.colorBox2.style.backgroundColor = "#00ff80";
    await loadCars();
  });
};

const generateRandomCars = (
  count: number
): { id: number; name: string; color: string }[] => {
  const marks = [
    "BMW",
    "Kia",
    "Mazda",
    "Subaru",
    "Volvo",
    "Peugeot",
    "Jaguar",
    "Hyundai",
    "Ferrari",
    "Porsche",
    "Bugatti",
  ];
  const names = [
    "Stinger",
    "RX-7",
    "Impreza",
    "XC90",
    "208",
    "F-Type",
    "Elantra",
    "488 GTB",
    "911",
    "Chiron",
  ];
  const colors = [
    "#000000",
    "#FFFFFF",
    "#FF0000",
    "#00FF00",
    "#0000FF",
    "#FFFF00",
    "#FFA500",
    "#800080",
    "#FFC0CB",
    "#A52A2A",
  ];

  const cars = [];
  let id = getNextId();

  for (let i = 0; i < count; i++) {
    const name = `${marks[Math.floor(Math.random() * marks.length)]} ${
      names[Math.floor(Math.random() * names.length)]
    }`;
    const color = colors[Math.floor(Math.random() * colors.length)];
    cars.push({ id: id++, name, color });
  }

  return cars;
};

const saveCarsToDB = async (
  cars: { id: number; name: string; color: string }[]
) => {
  await Promise.all(
    cars.map((car) =>
      fetch("http://localhost:3000/garage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(car),
      })
    )
  );
};

const setupGenerateCarsListener = () => {
  UI.generateBtn.addEventListener("click", async () => {
    const cars = generateRandomCars(randomCarAmount);
    await saveCarsToDB(cars);
    await loadCars();
  });
};

const setRaceUIState = (
  buttonAParam: HTMLButtonElement,
  buttonBParam: HTMLButtonElement
) => {
  const buttonA = buttonAParam;
  const buttonB = buttonBParam;

  buttonB.classList.add("active");
  buttonA.classList.remove("active");
  buttonA.disabled = true;
  buttonB.disabled = false;
};

const animateCar = async (id: number, htmlParam: HTMLElement, time: number) => {
  const html = htmlParam;
  const maxX =
    (html.closest(".raceTrack") as HTMLElement).clientWidth - sixtyPx;
  html.style.transition = "none";
  html.style.transform = "translateX(0)";
  void html.offsetWidth;
  html.style.transition = `transform ${time}s linear`;
  html.style.transform = `translateX(${maxX}px)`;

  try {
    const res = await fetch(
      `http://localhost:3000/engine?id=${id}&status=drive`,
      { method: "PATCH" }
    );
    if (!res.ok) throw new Error(await res.text());
    return true;
  } catch {
    const matrix = new DOMMatrixReadOnly(
      window.getComputedStyle(html).transform
    );
    html.style.transition = "none";
    html.style.transform = `translateX(${matrix.m41}px)`;
    return false;
  }
};

const handleRaceClick = async () => {
  const cars = Array.from(
    document.querySelectorAll(".carsList > [data-id]")
  ) as HTMLElement[];
  const results: { id: number; time: number; name: string; color: string }[] =
    [];

  await Promise.all(
    cars.map(async (el) => {
      const id = +el.dataset.id!;
      const svg = el.querySelector(".raceTrackCar") as SVGElement;
      const html = svg as unknown as HTMLElement;
      const [buttonA, buttonB] = el.querySelectorAll(
        ".workingButton"
      ) as NodeListOf<HTMLButtonElement>;
      setRaceUIState(buttonA, buttonB);

      const res = await changeEngineStatus(id, "started");
      if (!res) return;

      const time = res.distance / res.velocity / oneSecond;
      const success = await animateCar(id, html, time);
      if (success) {
        const car = allCars.find((c) => c.id === id)!;
        results.push({
          id,
          time: +time.toFixed(two),
          name: car.name,
          color: car.color,
        });
      }
    })
  );

  if (results.length) {
    const winner = results.reduce((a, b) => (a.time < b.time ? a : b));
    await saveWinner(winner.id, winner.time);
    UI.winnerDisplay.innerHTML = `<h1 class="winnerAlert">Winner ${winner.name} - ${winner.time}s</h1>`;
    await loadWinners();
  }
};

const setupRaceButtonListener = () => {
  UI.raceBtn.addEventListener("click", handleRaceClick);
};

const setupResetButtonListener = () => {
  UI.resetBtn.addEventListener("click", async () => {
    const cars = Array.from(
      document.querySelectorAll(".carsList > [data-id]")
    ) as HTMLElement[];
    await Promise.all(
      cars.map(async (el) => {
        const id = +el.dataset.id!;
        const svg = el.querySelector(".raceTrackCar") as SVGElement;
        const buttons = el.querySelectorAll(
          ".workingButton"
        ) as NodeListOf<HTMLButtonElement>;
        const buttonA = buttons[0];
        const buttonB = buttons[1];
        buttonA.classList.add("active");
        buttonB.classList.remove("active");
        buttonB.disabled = true;
        buttonA.disabled = false;
        const winnerAlert = document.querySelector(
          ".winnerAlert"
        ) as HTMLElement;
        if (winnerAlert) winnerAlert.remove();
        const html = svg as unknown as HTMLElement;
        html.style.transition = "transform 0.5s ease-out";
        html.style.transform = "translateX(0px)";
        await changeEngineStatus(id, "stopped");
      })
    );
  });
};

const updateSortState = (buttonParam: HTMLButtonElement): "asc" | "desc" => {
  const button = buttonParam;

  const arrow = document.querySelector(".arrow");
  arrow?.remove();

  const isCurrentlyUp = button.classList.contains("up");
  button.classList.remove("up", "down");
  const direction = isCurrentlyUp ? "desc" : "asc";
  button.classList.add(direction === "asc" ? "up" : "down");

  button.innerHTML +=
    direction === "asc"
      ? `<svg class="arrow" width="16px" height="16px" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 5H3L3 16H5L5 5L8 5V4L4 0L0 4V5Z" fill="#000000"/>
        <path d="M16 16H10V14H16V16Z" fill="#000000"/>
        <path d="M10 12H14V10H10V12Z" fill="#000000"/>
        <path d="M12 8H10V6H12V8Z" fill="#000000"/>
      </svg>`
      : `<svg class="arrow" width="16px" height="16px" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 11H3L3 0H5L5 11H8V12L4 16L0 12V11Z" fill="#000000"/>
        <path d="M16 0H10V2H16V0Z" fill="#000000"/>
        <path d="M10 4H14V6H10V4Z" fill="#000000"/>
        <path d="M12 8H10V10H12V8Z" fill="#000000"/>
      </svg>`;

  return direction;
};

const setupWinnersSortListener = () => {
  UI.winnersSort.addEventListener("click", async () => {
    const direction = updateSortState(UI.winnersSort);
    const data = await getData();
    const sorted = await sortByWins();
    if (!data || !sorted) return;

    const source = direction === "asc" ? sorted.ascWins : sorted.descWins;
    allWinners = source.map((w: Winner) => {
      const car = data.cars.find((c: Car) => c.id === w.id);
      return {
        ...w,
        name: car?.name || "Unknown",
        color: car?.color || "#ccc",
      };
    });
    renderWinners(currentWinnersPage);
  });
};

const setupTimeSortListener = () => {
  UI.timeSort.addEventListener("click", async () => {
    const direction = updateSortState(UI.timeSort);
    const data = await getData();
    const sorted = await sortByTime();
    if (!data || !sorted) return;

    const source = direction === "asc" ? sorted.ascTime : sorted.descTime;
    allWinners = source.map((w: Winner) => {
      const car = data.cars.find((c: Car) => c.id === w.id);
      return {
        ...w,
        name: car?.name || "Unknown",
        color: car?.color || "#ccc",
      };
    });
    renderWinners(currentWinnersPage);
  });
};

const setupEventListeners = () => {
  setupCreateCarListener();
  setupUpdateCarListener();
  setupGenerateCarsListener();
  setupRaceButtonListener();
  setupResetButtonListener();
  setupWinnersSortListener();
  setupTimeSortListener();
  setupDeleteAllCarsListener();
};

const init = async () => {
  setupPageSwitching();
  setupColorPickers();
  setupPagination();
  setupResizeHandler();
  setupEventListeners();
  await loadCars();
  await loadWinners();
};

init();
