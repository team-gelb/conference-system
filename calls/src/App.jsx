import { useState } from "react";
import { Routes, Route, Link } from "react-router";

const CloudflareWorkerComponent = () => {
    const [data, setData] = useState(null);
    const [input, setInput] = useState("");

    const fetchData = async () => {
        try {
            const response = await fetch(`/${input}`);
            if (!response.ok) {
                throw new Error("Fehler beim Abrufen der Daten");
            }
            const result = await response.text();
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
};

const HomePage = () => {
    const [count, setCount] = useState(0);

    return (
        <div>
            <h1 className={"text-gray-500 dark:text-gray-400"}>Home Page</h1>
            <CloudflareWorkerComponent />
            <div className="card">
                <button onClick={() => setCount(count + 1)}>
                    count is {count}
                </button>
                <p>Editiere <code>src/App.jsx</code> und speichere, um HMR zu testen.</p>
            </div>
        </div>
    );
};

const App = () => {
    return (
        <div className="container">
            <nav style={{ marginBottom: "1rem" }}>
                <Link style={{ marginRight: "1rem" }} to="/">
                    Home
                </Link>
            </nav>
            <Routes>
                <Route path="/" element={<HomePage />} />
            </Routes>
        </div>
    );
};

export default App;
