import { useState } from "react";
import "./App.css";

function CloudflareWorkerComponent() {
  const [data, setData] = useState(null);
  const [input, setInput] = useState("");

  const fetchData = async () => {
    try {
      const response = await fetch(`https://team-gelb.de/${input}`);
      if (!response.ok) {
        throw new Error("Fehler beim Abrufen der Daten");
      }
      const result = await response;
      setData(result);
    } catch (error) {
      console.error("Fehler:", error);
      setData("Fehler beim Laden der Daten.");
    }
  };

  return (
    <div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Gib einen Wert ein..."
      />
      <button onClick={fetchData}>Daten abrufen</button>
      <div>{data ? data : "Noch keine Daten geladen."}</div>
    </div>
  );
}

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <div>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <CloudflareWorkerComponent />
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  );
}

export default App;
