import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Navbar from "./components/Navbar";
import Clubs from "./pages/Clubs";
import Login from "./auth/Login";
import Register from "./auth/Register";
import EventPage from "./pages/Events";
import EventRegisterPage from "./pages/EventRegisterPage";
import Account from "./pages/Account";
import HomePage from "./pages/HomePage";
import ClubDetails from "./pages/ClubDetails";
import EventDetails from "./pages/EventDetails";
import About from "./pages/About";
import Contact from "./pages/Contact";
import PermissionRequestForm from "./components/PermissionRequestForm";
import MyRequestsList from "./components/MyRequestsList";
import ApprovalDashboard from "./components/ApprovalDashboard";
import ClubApplications from "./pages/ClubApplications";
import MyEvents from "./pages/MyEvents";

function App() {
  return (
    <BrowserRouter>
      <ToastContainer position="bottom-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnHover />
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/Signup" element={<Register />} />
        <Route path="/clubs" element={<Clubs />} />

        {/* Permission System Routes */}
        <Route path="/create-permission" element={<PermissionRequestForm />} />
        <Route path="/my-requests" element={<MyRequestsList />} />
        <Route path="/approvals" element={<ApprovalDashboard />} />

        <Route path="/clubs/:clubId" element={<ClubDetails />} />
        <Route path="/clubs/:clubId/applications" element={<ClubApplications />} />
        <Route path="/account" element={<Account />} />
        <Route path="/events" element={<EventPage />} />
        <Route path="/events/:eventId" element={<EventDetails />} />
        <Route path="/events/:eventId/register" element={<EventRegisterPage />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/my-events" element={<MyEvents />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
