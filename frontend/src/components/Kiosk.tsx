import React, { useState } from 'react';
import { Search, User, Clock, CheckCircle, XCircle } from 'lucide-react';
import { searchStudents, checkInStudent, checkOutStudent } from '../services/api';

interface Student {
  id: number;
  student_number: string;
  nickname: string;
  first_name: string;
  last_name: string;
  school_level: string;
}

const Kiosk: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const results = await searchStudents(searchQuery);
      setSearchResults(results);
      setMessage('');
    } catch (error) {
      setMessage('Error searching for students');
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student);
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleCheckIn = async () => {
    if (!selectedStudent) return;
    
    setLoading(true);
    try {
      await checkInStudent(selectedStudent.id);
      setMessage(`Check-in successful for ${selectedStudent.first_name} ${selectedStudent.last_name}`);
      setSelectedStudent(null);
    } catch (error) {
      setMessage('Error during check-in');
      console.error('Check-in error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!selectedStudent) return;
    
    setLoading(true);
    try {
      await checkOutStudent(selectedStudent.id);
      setMessage(`Check-out successful for ${selectedStudent.first_name} ${selectedStudent.last_name}`);
      setSelectedStudent(null);
    } catch (error) {
      setMessage('Error during check-out');
      console.error('Check-out error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            מערכת נוכחות בית ספר
          </h1>
          <p className="text-lg text-gray-600">
            אנא חפש את שמך או מספר התלמיד שלך
          </p>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="חפש לפי מספר תלמיד, כינוי, שם פרטי או שם משפחה..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                  dir="rtl"
                />
              </div>
            </div>
            <button
              onClick={handleSearch}
              disabled={loading || !searchQuery.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'מחפש...' : 'חפש'}
            </button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">תוצאות חיפוש:</h3>
              <div className="space-y-2">
                {searchResults.map((student) => (
                  <div
                    key={student.id}
                    onClick={() => handleStudentSelect(student)}
                    className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <User className="w-5 h-5 text-gray-500" />
                        <div className="text-right">
                          <div className="font-semibold text-gray-800">
                            {student.first_name} {student.last_name}
                          </div>
                          <div className="text-sm text-gray-600">
                            {student.nickname} • {student.student_number}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {student.school_level}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Selected Student Actions */}
        {selectedStudent && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-10 h-10 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {selectedStudent.first_name} {selectedStudent.last_name}
              </h2>
              <p className="text-gray-600">
                {selectedStudent.nickname} • {selectedStudent.student_number}
              </p>
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={handleCheckIn}
                disabled={loading}
                className="flex items-center gap-2 px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold"
              >
                <CheckCircle className="w-6 h-6" />
                כניסה
              </button>
              <button
                onClick={handleCheckOut}
                disabled={loading}
                className="flex items-center gap-2 px-8 py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold"
              >
                <XCircle className="w-6 h-6" />
                יציאה
              </button>
            </div>

            <div className="text-center mt-4">
              <button
                onClick={() => setSelectedStudent(null)}
                className="text-gray-500 hover:text-gray-700 underline"
              >
                בחירת תלמיד אחר
              </button>
            </div>
          </div>
        )}

        {/* Message Display */}
        {message && (
          <div className="mt-4 p-4 bg-blue-100 border border-blue-300 rounded-lg text-center">
            <p className="text-blue-800">{message}</p>
          </div>
        )}

        {/* Current Time */}
        <div className="text-center mt-8">
          <div className="inline-flex items-center gap-2 text-gray-600">
            <Clock className="w-5 h-5" />
            <span>{new Date().toLocaleTimeString('he-IL')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Kiosk;
