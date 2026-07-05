"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  User, 
  Phone, 
  Mail, 
  Copy, 
  Check, 
  CheckCircle,
  Calendar,
  PhoneCall,
  MessageCircle,
  MessageSquare
} from "lucide-react";

interface PublisherCardProps {
  owner: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    image: string | null;
    role: string;
    isVerified: boolean;
    createdAt: Date;
  } | null;
  propertyId?: string; // ✅ تأكد من وجود هذا
}

export function PublisherCard({ owner, propertyId }: PublisherCardProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!owner) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <User className="w-5 h-5" />
          الناشر
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          معلومات الناشر غير متاحة
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <User className="w-5 h-5" />
        الناشر
      </h3>

      {/* معلومات الناشر */}
      <div className="flex items-center gap-4 mb-4">
        <div className="relative w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
          {owner.image ? (
            <Image
              src={owner.image}
              alt={owner.name}
              fill
              className="object-cover"
            />
          ) : (
            owner.name?.[0] || "U"
          )}
        </div>
        <div>
          <h4 className="font-bold text-gray-900 dark:text-white text-lg">
            {owner.name}
          </h4>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500 dark:text-gray-400">
              {owner.role === "agency_owner" ? "مالك وكالة" : "مستخدم"}
            </span>
            {owner.isVerified && (
              <span className="text-green-500 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                موثق
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            عضو منذ {new Date(owner.createdAt).toLocaleDateString('ar-SA')}
          </p>
        </div>
      </div>

      {/* طرق التواصل */}
      <div className="space-y-3">
        {/* رقم الهاتف */}
        {owner.phone && (
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-blue-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {owner.phone}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={`tel:${owner.phone}`}
                className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                title="اتصال"
              >
                <PhoneCall className="w-4 h-4" />
              </a>
              <a
                href={`https://wa.me/${owner.phone.replace(/\s/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                title="واتساب"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
              <button
                onClick={() => copyToClipboard(owner.phone)}
                className="p-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition"
                title="نسخ الرقم"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {/* البريد الإلكتروني */}
        {owner.email && (
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-blue-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {owner.email}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={`mailto:${owner.email}`}
                className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                title="إرسال بريد"
              >
                <Mail className="w-4 h-4" />
              </a>
              <button
                onClick={() => copyToClipboard(owner.email)}
                className="p-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition"
                title="نسخ البريد"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {/* زر التواصل الداخلي (رسالة) */}
        {owner.id && propertyId && (
          <Link
            href={`/messages?to=${owner.id}&property=${propertyId}`}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
          >
            <MessageSquare className="w-5 h-5" />
            إرسال رسالة مباشرة
          </Link>
        )}
      </div>

      {/* روابط التواصل الاجتماعي */}
      {(owner.facebook || owner.twitter || owner.instagram) && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">تابعني على</p>
          <div className="flex gap-3">
            {owner.facebook && (
              <a
                href={owner.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <span className="text-sm">📘</span>
              </a>
            )}
            {owner.twitter && (
              <a
                href={owner.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition"
              >
                <span className="text-sm">🐦</span>
              </a>
            )}
            {owner.instagram && (
              <a
                href={owner.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition"
              >
                <span className="text-sm">📸</span>
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}