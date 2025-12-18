import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';

// Import the pages we created
import Dashboard from './pages/Dashboard';
import Guests from './pages/Guests';
import Rooms from './pages/Rooms';
import Bookings from './pages/Bookings';

function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen bg-slate-50">
        {/* 1. Sidebar (Stays on the left forever) */}
        <Sidebar />
        
        {/* 2. Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          
          {/* Header (Stays on top forever) */}
          <header className="bg-white shadow-sm p-6 flex justify-between items-center sticky top-0 z-10">
            <h2 className="text-2xl font-bold text-slate-800">Atithi Manager</h2>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-500">Welcome, Owner</span>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                A
              </div>
            </div>
          </header>

          {/* 3. The Changing Content (Routes) */}
          {/* This part switches automatically when you click Sidebar buttons */}
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/guests" element={<Guests />} />
            <Route path="/rooms" element={<Rooms />} />
            <Route path="/bookings" element={<Bookings />} />
          </Routes>

        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;