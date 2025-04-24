import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './index.css'
import Navibar from './components/layout/Navibar';
import Chatbot from './Chatbot'

export default function App() {
  return(
    <>
      <Navibar/>
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col">
          <h1 className="text-center text-3xl font-bold">Welcome To MindaGrow</h1>
          <p className="text-center mt-4">
            Your E - Learning Platform
          </p>
          <Link to='/chatbot' >
            <button className='bg-biru-dasar text-white hover:bg-gold-first  p-[10px] m-10  font-semibold rounded-2xl '>Click Here To Chat With ChatBot</button>
          </Link>
        </div>
      </div>
    </>
  );
}

