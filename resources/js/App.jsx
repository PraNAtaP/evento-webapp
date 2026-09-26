import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

function Home() {
    return (
        <div style={{ padding: "2rem" }}>
            <h1>EVENTO App</h1>
            <p>Arsitektur 1 Repo: Laravel Backend API + React Vite SPA</p>
            <nav style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                <Link to="/login">Login</Link>
                <Link to="/eo/kanban">Papan Kanban EO</Link>
                <Link to="/client/booking">Smart Calendar Klien</Link>
            </nav>
        </div>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route
                    path="/login"
                    element={<div>Halaman Login (3 Role)</div>}
                />
                <Route
                    path="/eo/kanban"
                    element={<div>Modul Kanban Board (EO)</div>}
                />
                <Route
                    path="/client/booking"
                    element={<div>Modul Smart Calendar (Klien)</div>}
                />
            </Routes>
        </BrowserRouter>
    );
}
