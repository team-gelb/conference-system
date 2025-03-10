import { useEffect, useState } from "react";
import axios from "axios"; // Axios muss importiert werden
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";

function CloudflareWorkerComponent() {
  const [data, setData] = useState(null);
  const [input, setInput] = useState("");

  const fetchData = () => {
    axios
      .get(`https://team-gelb.de/${input}`)
      .then((response) => setData(response.data.message))
      .catch((error) => console.error("Fehler:", error));
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
