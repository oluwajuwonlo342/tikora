import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/layout/Navbar";
import Home from "./pages/Home/Home";
import CreateEvent from "./pages/Organizer/CreateEvent";
import Register from "./pages/Register";
import Login from "./pages/Login";
import MyEvents from "./pages/MyEvents";
import Dashboard from "./pages/Dashboard";
import MyTickets from "./pages/MyTickets";
import EventDetails from "./pages/events/EventDetails";
import TicketDetails from './pages/TicketDetails';
import EditEvent from "./pages/EditEvent";
import TicketScanner from './pages/Organizer/TicketScanner';
import Categories from "./pages/Categories";
import About from "./pages/About";
import Wallet from "./pages/Organizer/Wallet";
import PaymentVerify from "./pages/PaymentVerify";
import Events from "./pages/Events"; 
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/events" element={<Events />} />
        <Route path="/organizer/scanner" element={<TicketScanner />} />
        <Route path="/tickets/:id" element={<TicketDetails />} />
        
        {/* ✅ FIX: Single, correct verification route */}
        <Route path="/payment/verify" element={<PaymentVerify />} />
        
        <Route path="/events/:id" element={<EventDetails />} />
        <Route path="/register" element={<Register />} />
        <Route path="/my-events" element={<MyEvents />} />
        <Route path="/login" element={<Login />} />
        <Route path="/create-event" element={<CreateEvent />} />
        <Route path="/my-tickets" element={<MyTickets />} />
        <Route path="/edit-event/:id" element={<EditEvent />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/about" element={<About />} />
        <Route path="/wallet" element={<Wallet />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;