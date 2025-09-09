interface EngineStatus {
   velocity: number;
   distance: number;
}
export const getData = async () => {
  try {
    const [carsRes, winnersRes] = await Promise.all([
      fetch('http://localhost:3000/garage'),
      fetch('http://localhost:3000/winners'),
    ]);
    if (!carsRes.ok || !winnersRes.ok) throw new Error('Fetch failed');
    const cars = await carsRes.json();
    const winners = await winnersRes.json();
    return { cars, winners };
  } catch {
    return null;
  }
};

export const changeEngineStatus = async (
  id: number,
  status: 'started' | 'stopped' | 'drive',
): Promise<EngineStatus | null> => {
  try {
    const res = await fetch(
      `http://localhost:3000/engine?id=${id}&status=${status}`,
      {
        method: 'PATCH',
      },
    );
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
  } catch {
    return null;
  }
};

export const saveWinner = async (id: number, time: number): Promise<void> => {
  try {
    const res = await fetch(`http://localhost:3000/winners/${id}`);
    if (res.ok) {
      const winner = await res.json();
      await fetch(`http://localhost:3000/winners/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          wins: winner.wins + 1,
          time: Math.min(winner.time, time),
        }),
      });
    } else {
      await fetch('http://localhost:3000/winners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, wins: 1, time }),
      });
    }
  } catch (e) {
    console.error('Failed to save winner:', e);
  }
};

export const sortByWins = async () => {
  try {
    const [sortAscWins, sortDescWins] = await Promise.all([
      fetch('http://localhost:3000/winners?_sort=wins&_order=asc', {
        method: 'GET',
      }),
      fetch('http://localhost:3000/winners?_sort=wins&_order=desc', {
        method: 'GET',
      }),
    ]);

    if (!sortAscWins.ok || !sortDescWins.ok) throw new Error('Fetch failed');
    const ascWins = await sortAscWins.json();
    const descWins = await sortDescWins.json();
    return { ascWins, descWins };
  } catch {
    return null;
  }
};

export const sortByTime = async () => {
  try {
    const [sortAscTime, sortDescTime] = await Promise.all([
      fetch('http://localhost:3000/winners?_sort=time&_order=asc', {
        method: 'GET',
      }),
      fetch('http://localhost:3000/winners?_sort=time&_order=desc', {
        method: 'GET',
      }),
    ]);

    if (!sortAscTime.ok || !sortDescTime.ok) throw new Error('Fetch failed');
    const ascTime = await sortAscTime.json();
    const descTime = await sortDescTime.json();
    return { ascTime, descTime };
  } catch {
    return null;
  }
};
