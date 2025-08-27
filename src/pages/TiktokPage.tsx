import { Link } from 'react-router-dom';

export default function TiktokPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-lg shadow p-6 text-center">
        <h1 className="text-2xl font-bold mb-2 text-pink-600">TikTok Chats</h1>
        <p className="text-sm text-gray-600 mb-4">This is a placeholder for TikTok chat management.</p>
        <Link to="/" className="text-sm text-blue-600 underline">Back</Link>
      </div>
    </div>
  );
}
