import { useNavigate } from "react-router-dom";

const NotFoundPage = () => {
  const navigate = useNavigate();

  const handleGoBack = (e) => {
    e.preventDefault();
    navigate(-1); // Kembali ke halaman sebelumnya dalam history
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-indigo-50">
      <div className="text-center bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-6xl font-bold text-indigo-600">404</h1>
        <p className="text-2xl mt-4 text-gray-800">Halaman tidak ditemukan</p>
        <button
          onClick={handleGoBack}
          className="mt-6 inline-block px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Kembali ke Halaman Sebelumnya
        </button>
      </div>
    </div>
  );
};

export default NotFoundPage;
