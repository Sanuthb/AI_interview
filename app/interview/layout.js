import InterviewProvider from "@/context/InterviewContext";
import InterviewHeader from "./_component/InterviewHeader";

export default function Layout({ children }) {
  return (
    <InterviewProvider>
      <div className="flex flex-col w-full h-screen overflow-hidden">
        <InterviewHeader />
        <main className="flex-1 bg-gray-100 flex items-center justify-center overflow-hidden">
          {children}
        </main>
      </div>
    </InterviewProvider>
  );
}
