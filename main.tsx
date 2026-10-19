import React from 'react';
import {createRoot} from 'react-dom/client';
import TeacherApp from './features/workspace/TeacherApp';
import './app/globals.css';
import './app/theme.css';
import './features/paper/print.css';

createRoot(document.getElementById('root')!).render(
 <React.StrictMode><TeacherApp/></React.StrictMode>,
);

if('serviceWorker' in navigator){
 window.addEventListener('load',()=>{
  void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`,{scope:import.meta.env.BASE_URL});
 });
}
