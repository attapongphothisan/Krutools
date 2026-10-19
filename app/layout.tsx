import type {Metadata} from 'next';
import './globals.css';import './theme.css';import '../features/paper/print.css';
export const metadata:Metadata={title:'เครื่องมือครู | ตรวจข้อสอบ',description:'สร้างกระดาษคำตอบ สแกนด้วยมือถือ สรุปคะแนนและส่งออก Excel',referrer:'no-referrer',icons:{icon:'/tool-images/site-logo.png'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="th"><body>{children}</body></html>}
