'use client';

export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex h-[calc(100vh-56px)] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#111]">
          <span className="text-2xl text-[#DFFF00]">◱</span>
        </div>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        <p className="mt-2 text-sm text-[#555]">Tính năng đang được phát triển trong giai đoạn tiếp theo.</p>
      </div>
    </div>
  );
}
