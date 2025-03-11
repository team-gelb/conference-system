import HomePage from "./pages/HomePage.jsx";
import { Routes, Route, Link } from "react-router";

const App = () => {
    return (
        <div className="container">
            <nav style={{ marginBottom: '1rem' }}>
                <Link style={{ marginRight: '1rem' }} to="/">Home</Link>
            </nav>
            <Routes>
                <Route path="/" element={<HomePage />} />
            </Routes>
        </div>
    );
};

export default App;