import InterviewProvider from "@/context/InterviewContext";

export default function Layout({ children }) {
  return (
    <InterviewProvider>
      <div className="flex flex-col w-full min-h-screen max-h-screen overflow-hidden">
        <main className="flex-1 bg-gray-100 flex items-center justify-center overflow-hidden">
          {children}
        </main>
      </div>
    </InterviewProvider>
  );
}
