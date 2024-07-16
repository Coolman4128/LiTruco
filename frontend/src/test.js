import React from 'react';
import 'tailwindcss/tailwind.css';

const TrucoGame = () => {
  return (
    <div className="bg-gray-900 text-white h-screen flex justify-center items-center relative">
      <div className="table p-4 rounded-lg shadow-lg flex flex-col items-center relative" style={{ width: '800px', height: '600px' }}>
        <div className="w-full flex justify-between items-center mb-4 text-center">
          <div>Team 1 Score: 6</div>
          <div>Team 2 Score: 3</div>
          <div>Trump: Jack</div>
          <div>
            Tricks:
            <span className="inline-block w-4 h-4 bg-red-500 rounded-full"></span>
            <span className="inline-block w-4 h-4 bg-green-500 rounded-full"></span>
            <span className="inline-block w-4 h-4 bg-gray-500 rounded-full"></span>
          </div>
        </div>

        <div className="flex flex-col items-center w-full h-full justify-between">
          <div className="flex flex-col items-center mb-4">
            <div className="w-12 h-12 bg-gray-500 rounded-full mb-2"></div>
            <div>RaptorPaws</div>
            <div className="card-slot mb-4"></div>
          </div>

          <div className="flex justify-center items-center mb-4">
            <div className="card-slot mx-2"></div>
            <div className="card-slot mx-2"></div>
            <div className="card-slot mx-2"></div>
          </div>

          <div className="flex justify-between w-full">
            <div className="flex flex-col items-center mx-4">
              <div className="w-12 h-12 bg-gray-500 rounded-full mb-2"></div>
              <div>Coolguy1</div>
              <div className="card-slot"></div>
            </div>
            <div className="flex flex-col items-center mx-4">
              <div className="w-12 h-12 bg-gray-500 rounded-full mb-2"></div>
              <div>FredBow</div>
              <div className="card-slot"></div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-4 flex justify-center items-center w-full">
          <div className="card bg-red-500 mx-2"></div>
          <div className="card bg-red-500 mx-2"></div>
          <div className="card bg-red-500 mx-2"></div>
        </div>
      </div>

      <div className="absolute left-0 top-0 h-full w-24 bg-gray-700 flex flex-col justify-center items-center">
        <div className="mb-4">Ad 1</div>
        <div>Ad 2</div>
      </div>
      <div className="absolute right-0 top-0 h-full w-24 bg-gray-700 flex flex-col justify-center items-center">
        <div className="mb-4">Ad 3</div>
        <div>Ad 4</div>
      </div>
    </div>
  );
};

export default TrucoGame;