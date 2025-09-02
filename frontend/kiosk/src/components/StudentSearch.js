import React, { useState } from 'react';

function StudentSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const handleSearch = async () => {
    // In a real application, you would make an API call here
    // For now, let's simulate some search results
    console.log(`Searching for: ${searchTerm}`);
    const dummyResults = [
      { id: 1, student_number: "123", nickname: "Alice", first_name: "Alice", last_name: "Smith" },
      { id: 2, student_number: "456", nickname: "Bob", first_name: "Bob", last_name: "Johnson" },
    ];
    setSearchResults(dummyResults.filter(student => 
      student.student_number.includes(searchTerm) ||
      student.nickname.includes(searchTerm) ||
      student.first_name.includes(searchTerm) ||
      student.last_name.includes(searchTerm)
    ));
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Enter student number, nickname, first name, or last name"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <button onClick={handleSearch}>Search</button>

      <div>
        <h3>Search Results:</h3>
        {searchResults.length === 0 ? (
          <p>No results found.</p>
        ) : (
          <ul>
            {searchResults.map((student) => (
              <li key={student.id}>
                {student.first_name} {student.last_name} ({student.student_number})
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default StudentSearch;
