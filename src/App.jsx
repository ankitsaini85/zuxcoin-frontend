import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect, lazy, Suspense } from "react";
import Preloader from "./components/Preloader";

// Lazy load all page components
const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const GetCard = lazy(() => import("./pages/GetCard"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Withdrawal = lazy(() => import("./pages/Withdrawal"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Transactions = lazy(() => import("./pages/Transactions"));
const UserGenealogy = lazy(() => import("./pages/UserGenealogy"));
const BankDetails = lazy(() => import("./pages/BankDetails"));

function App() {
  const [isLoading, setIsLoading] = useState(true);

  const handleLoadComplete = () => {
    setIsLoading(false);
  };

  if (isLoading) {
    return <Preloader onLoadComplete={handleLoadComplete} />;
  }

  return (
    <BrowserRouter>
      <Suspense fallback={<Preloader onLoadComplete={() => {}} />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/get-card" element={<GetCard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/withdrawal" element={<Withdrawal />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/genealogy" element={<UserGenealogy />} />
          <Route path="/bank-details" element={<BankDetails />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
