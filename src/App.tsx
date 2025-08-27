import { FaTelegramPlane, FaFacebookF } from 'react-icons/fa';
import { SiTiktok } from 'react-icons/si';
import { Link } from 'react-router-dom';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-8">
      <h1 className="text-3xl font-bold mb-6 text-blue-700">Pony Chat Admin</h1>
      <p className="text-sm text-gray-500 mb-4">Select a platform to manage chats</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-md px-4">
        <Link to="/facebook" className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg shadow hover:scale-105 transition border border-gray-200">
          <FaFacebookF className="text-indigo-600 size-6" />
          <span className="font-semibold">Facebook</span>
        </Link>
        <Link to="/telegram" className="relative flex flex-col items-center gap-2 p-4 bg-white rounded-lg shadow hover:scale-105 transition border border-gray-200">
          <FaTelegramPlane className="text-blue-500 size-6" />
          <span className="font-semibold">Telegram</span>
        </Link>
        <Link to="/tiktok" className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg shadow hover:scale-105 transition border border-gray-200">
          <SiTiktok className="text-pink-600 size-6" />
          <span className="font-semibold">TikTok</span>
        </Link>
      </div>
    </div>
  );
}

