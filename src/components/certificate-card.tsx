"use client";

import Image from "next/image";
import { Award, ShieldCheck, Printer, Download, Share2, Sparkles } from "lucide-react";

interface CertificateProps {
  id: string;
  studentName: string;
  courseTitle: string;
  date: string;
  locale?: string;
  onPrint?: () => void;
}

export default function CertificateCard({
  id,
  studentName,
  courseTitle,
  date,
  locale = "ar",
  onPrint,
}: CertificateProps) {
  const isAr = locale === "ar";

  const handlePrint = () => {
    if (onPrint) onPrint();
    else window.print();
  };

  return (
    <div className="space-y-6">
      {/* Printable Certificate Frame */}
      <div
        id="certificate-print-area"
        className="relative w-full max-w-4xl mx-auto aspect-[1.414/1] bg-white text-slate-900 rounded-3xl p-8 sm:p-14 shadow-2xl border-8 border-double border-brand-navy overflow-hidden select-none"
        style={{ color: "#0B1F4B" }}
      >
        {/* Decorative Topographic Background Contour Watermark */}
        <div className="absolute inset-0 topographic-lines opacity-15 pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-brand-cyan/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-brand-blue/15 blur-3xl pointer-events-none" />

        {/* Certificate Outer Border Accents */}
        <div className="absolute top-4 left-4 right-4 bottom-4 border border-brand-cyan/40 rounded-2xl pointer-events-none" />

        {/* Certificate Content */}
        <div className="relative z-10 h-full flex flex-col justify-between text-center">
          {/* Top Header & Logo */}
          <div className="flex items-center justify-between pb-4 border-b border-brand-navy/15">
            <div className="flex items-center gap-3">
              <div className="relative w-14 h-14 rounded-xl overflow-hidden p-0.5 bg-gradient-to-tr from-brand-navy via-brand-blue to-brand-cyan shadow-md">
                <div className="relative w-full h-full rounded-[10px] overflow-hidden bg-white">
                  <Image src="/logo.jpg" alt="Logo" fill className="object-cover" />
                </div>
              </div>
              <div className="text-start">
                <span className="font-extrabold text-base tracking-tight text-brand-navy block">
                  FATHY GEO CODE
                </span>
                <span className="text-[10px] font-semibold text-brand-blue tracking-wider block">
                  GIS & REMOTE SENSING EDUCATIONAL HUB
                </span>
              </div>
            </div>

            <div className="text-end font-mono text-[11px] text-slate-500">
              <span className="block font-bold text-brand-navy">{id}</span>
              <span>VERIFIED CREDENTIAL</span>
            </div>
          </div>

          {/* Certificate Main Title */}
          <div className="space-y-2 py-4">
            <span className="inline-block px-4 py-1 rounded-full text-xs font-bold tracking-widest uppercase bg-brand-cyan/15 text-brand-navy border border-brand-cyan/40">
              {isAr ? "شهادة إتمام معتمدة" : "CERTIFICATE OF COMPLETION"}
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-brand-navy">
              {isAr ? "شهادة اجتياز وتفوق مهني" : "Certificate of Achievement"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
              {isAr
                ? "يشهد مركز FATHY GEO CODE التعليمي بأن المهندس / الطالب قد أتم بنجاح كافة متطلبات الدورة التخصصية:"
                : "This certifies that the recipient has successfully fulfilled all technical curriculum requirements for:"}
            </p>
          </div>

          {/* Student Name */}
          <div className="my-2 py-2 border-b-2 border-brand-cyan max-w-md mx-auto w-full">
            <h2 className="text-2xl sm:text-3xl font-black text-brand-navy tracking-wide">
              {studentName}
            </h2>
          </div>

          {/* Course Name */}
          <div className="my-2">
            <p className="text-base sm:text-xl font-extrabold text-brand-blue">
              "{courseTitle}"
            </p>
          </div>

          {/* Bottom Verification & Signatures */}
          <div className="pt-6 border-t border-brand-navy/15 flex items-end justify-between">
            {/* QR Code & Verify */}
            <div className="flex items-center gap-3 text-start">
              <div className="w-16 h-16 bg-white p-1 rounded-lg border border-slate-300 shadow-sm flex items-center justify-center">
                {/* SVG QR Code Simulation */}
                <svg className="w-full h-full" viewBox="0 0 24 24" fill="#0B1F4B">
                  <path d="M3 3h6v6H3V3zm2 2v2h2V5H5zm8-2h6v6h-6V3zm2 2v2h2V5h-2zM3 13h6v6H3v-6zm2 2v2h2v-2H5zm13-2h3v3h-3v-3zm-5 0h2v2h-2v-2zm2 2h2v2h-2v-2zm-2 2h2v2h-2v-2zm4 0h2v2h-2v-2zm0 2h3v2h-3v-2z" />
                </svg>
              </div>
              <div className="text-[10px] text-slate-500 space-y-0.5">
                <span className="block font-bold text-brand-navy">
                  {isAr ? "رمز التحقق الإلكتروني" : "Scan to Verify"}
                </span>
                <span className="font-mono block">fathygeocode.com/verify</span>
                <span className="text-slate-400 font-mono">{date}</span>
              </div>
            </div>

            {/* Official Stamp */}
            <div className="hidden sm:flex flex-col items-center">
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-brand-cyan/60 flex items-center justify-center text-brand-cyan p-1">
                <div className="w-full h-full rounded-full border border-brand-cyan flex items-center justify-center text-[9px] font-bold uppercase tracking-tighter text-center leading-none text-brand-navy">
                  OFFICIAL
                  <br />
                  STAMP
                </div>
              </div>
            </div>

            {/* Signature */}
            <div className="text-end space-y-1">
              <div className="font-serif italic text-lg sm:text-xl text-brand-navy tracking-wider">
                Ahmed Fathy
              </div>
              <div className="w-36 h-0.5 bg-brand-navy ms-auto" />
              <div className="text-xs font-bold text-brand-navy">
                {isAr ? "م. أحمد فتحي" : "Eng. Ahmed Fathy"}
              </div>
              <div className="text-[10px] text-slate-500">
                {isAr ? "محلل بيانات مكانية واستشعار عن بعد" : "Spatial Data Analyst"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons (Excluded from Print via CSS) */}
      <div className="flex items-center justify-center gap-3 print:hidden">
        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-brand-navy via-brand-blue to-brand-cyan shadow-lg shadow-brand-blue/20 hover:scale-105 active:scale-95 transition-all"
        >
          <Printer className="w-4 h-4" />
          <span>{isAr ? "طباعة / حفظ كـ PDF" : "Print / Save as PDF"}</span>
        </button>

        <a
          href={`/${locale}/verify/${id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-semibold border border-border bg-card hover:bg-muted text-foreground transition-all"
        >
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>{isAr ? "رابط التحقق الرسمي" : "Public Verification Link"}</span>
        </a>
      </div>
    </div>
  );
}
