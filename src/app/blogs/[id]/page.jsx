"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import HeaderHome from "@/components/header";
import Footer from "@/components/footer";
import { AlertCircle } from "lucide-react";
import { useTranslations, useLocale } from 'next-intl';

const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function BlogDetailPage() {
  const params = useParams();
  const blogId = params?.id;
  const t = useTranslations('BlogDetail');
  const locale = useLocale();

  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (blogId) {
      fetchBlog();
    }
  }, [blogId]);

  const fetchBlog = async () => {
    try {
      const response = await fetch(`${backendUrl}/blogs/${blogId}`);
      
      if (!response.ok) {
        throw new Error(t('errors.fetchFailed'));
      }

      const result = await response.json();
      setBlog(result.data);
    } catch (err) {
      setError(err.message || t('errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <HeaderHome />
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
        <Footer />
      </>
    );
  }

  if (error || !blog) {
    return (
      <>
        <HeaderHome />
        <div className="min-h-screen bg-white py-20">
          <div className="container mx-auto px-6">
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 flex items-start gap-3 max-w-2xl mx-auto">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-red-700 font-semibold">{t('errors.notFoundTitle')}</p>
                <p className="text-sm text-red-600 mt-1">{error || t('errors.notFoundDescription')}</p>
              </div>
            </div>
            
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <HeaderHome />
      <div className="min-h-screen bg-white ">
        <div className="container mx-auto px-6 py-12">
         

          {/* Article Header */}
          <article className="max-w-4xl mx-auto">
            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-[#556822] mb-6 uppercase leading-tight text-center font-[agrandir]">
              {blog.title}
            </h1>

            {/* Publication Date */}
            <div className="text-center text-gray-600 text-sm mb-12">
              {new Date(blog.publicationDate).toLocaleDateString(locale, {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>

            {/* Featured Image */}
            {blog.imageUrl && (
              <div className="relative h-96 w-full bg-gray-200 rounded-lg overflow-hidden mb-12">
                <Image
                  src={blog.imageUrl}
                  alt={blog.title}
                  fill
                  className="object-cover"
                  priority
                  unoptimized={true}
                />
              </div>
            )}

            {/* Content */}
            <div className="prose prose-lg max-w-none">
              <div className="text-gray-700 leading-relaxed whitespace-pre-wrap text-lg font-[Maison_Neue]">
                {blog.content.split('\n\n').map((paragraph, idx) => {
                  // Check if paragraph is a heading (starts with uppercase and is short)
                  const isHeading = paragraph.length < 100 && /^[A-Z]/.test(paragraph) && paragraph.match(/\?|:/) === null;
                  
                  if (isHeading && idx > 0) {
                    return (
                      <h2 key={idx} className="text-2xl md:text-3xl font-bold text-gray-900 uppercase my-8 py-4 border-b-2 border-gray-200 font-[agrandir]">
                        {paragraph}
                      </h2>
                    );
                  }
                  
                  return (
                    <p key={idx} className="mb-6 text-gray-700 leading-relaxed font-[Maison_Neue]">
                      {paragraph}
                    </p>
                  );
                })}
              </div>
            </div>

           
          </article>
        </div>
      </div>
      <Footer />
    </>
  );
}
