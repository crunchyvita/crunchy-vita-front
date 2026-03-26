"use client";

import { useEffect, useState } from "react";
import { Link } from "@/navigation";
import Image from "next/image";
import HeaderAndBreadcrumbs from "@/components/HeaderAndBreadcrumbs";
import Footer from "@/components/footer";
import { ArrowRight } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";

const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function BlogsPage() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const t = useTranslations("Blogs");
  const locale = useLocale(); // ✅ "fr" or "en"

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      // ⚠️ keep your backend path: you currently use `${backendUrl}/blogs`
      const response = await fetch(`${backendUrl}/blogs`);
      if (response.ok) {
        const result = await response.json();
        setBlogs(result.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch blogs:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ pick the right localized fields
  const getBlogTitle = (blog) => {
    if (locale === "en") return blog.title_en || blog.title || "";
    return blog.title || blog.title_en || "";
  };

  const getBlogContent = (blog) => {
    if (locale === "en") return blog.content_en || blog.content || "";
    return blog.content || blog.content_en || "";
  };

  const getShortSummary = (content) => {
    if (!content) return "";
    return content.length > 100 ? content.substring(0, 100) + "..." : content;
  };

  const getBlogImages = (blog) => {
    if (Array.isArray(blog?.imageUrls) && blog.imageUrls.length > 0) {
      return blog.imageUrls.filter(Boolean);
    }

    if (blog?.imageUrl) {
      return [blog.imageUrl];
    }

    return [];
  };

  const getPrimaryImageUrl = (blog) => {
    const images = getBlogImages(blog);
    return images[0] || null;
  };

  const recentBlogs = blogs.slice(0, 3);
  const featuredBlog = blogs.length > 0 ? blogs[0] : null;
  const otherBlogs = blogs.slice(1);
  const featuredImageUrl = getPrimaryImageUrl(featuredBlog);
  const hasFeaturedImage = Boolean(featuredImageUrl);

  return (
    <>
      <HeaderAndBreadcrumbs />
      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="bg-white py-16 border-b border-gray-200">
          <div className="container mx-auto px-6">
            <h1 className="text-5xl font-bold text-center text-gray-900 uppercase font-[agrandir]">
              {t("hero.title")}
              <br />
              <span className="text-[#556822]">{t("hero.subtitle")}</span>
            </h1>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-16">
          <div className="container mx-auto px-6">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
              </div>
            ) : blogs.length > 0 ? (
              <>
                {/* Recent Blog Posts Section */}
                {recentBlogs.length > 0 && (
                  <div className="mb-20">
                    <h2 className="text-3xl font-bold text-gray-900 mb-8 font-[agrandir]">
                      {t("recent")}
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {recentBlogs.map((blog) => {
                        const title = getBlogTitle(blog);
                        const content = getBlogContent(blog);
                        const primaryImageUrl = getPrimaryImageUrl(blog);

                        return (
                          <Link key={`recent-${blog._id}`} href={`/blogs/${blog._id}`}>
                            <div className="cursor-pointer group bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                              {primaryImageUrl && (
                                <div className="relative h-48 w-full bg-gray-200">
                                  <Image
                                    src={primaryImageUrl}
                                    alt={title}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                    unoptimized={true}
                                  />
                                </div>
                              )}

                              <div className="p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-2 hover:text-[#558822] transition-colors line-clamp-2 font-[agrandir]">
                                  {title}
                                </h3>

                                <p className="text-gray-600 text-sm mb-4 line-clamp-3 font-[Maison_Neue]">
                                  {getShortSummary(content)}
                                </p>

                                <div className="flex items-center gap-2 text-[#558822] font-semibold text-sm hover:gap-3 transition-all">
                                  {t("readMore")}
                                  <ArrowRight className="h-4 w-4" />
                                </div>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Featured Blog Post */}
                <h2 className="text-3xl font-bold text-gray-900 mb-8 font-[agrandir]">
                  {t("allArticles")}
                </h2>

                {featuredBlog && (() => {
                  const title = getBlogTitle(featuredBlog);
                  const content = getBlogContent(featuredBlog);

                  return (
                    <div className={`grid grid-cols-1 gap-12 mb-16 ${hasFeaturedImage ? "lg:grid-cols-3" : ""}`}>
                      {/* Featured Image */}
                      {hasFeaturedImage && (
                        <div className="lg:col-span-2">
                          <Link href={`/blogs/${featuredBlog._id}`}>
                            <div className="relative h-96 w-full bg-gray-200 rounded-lg overflow-hidden cursor-pointer group">
                              <Image
                                src={featuredImageUrl}
                                alt={title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                unoptimized={true}
                                priority
                              />
                            </div>
                          </Link>
                        </div>
                      )}

                      {/* Featured Blog Sidebar */}
                      <div className="flex flex-col justify-center">
                        <Link href={`/blogs/${featuredBlog._id}`}>
                          <div className="cursor-pointer">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4 hover:text-[#558822] transition-colors uppercase leading-tight font-[agrandir]">
                              {title}
                            </h2>

                            <p className="text-gray-600 text-sm mb-6 leading-relaxed font-[Maison_Neue]">
                              {getShortSummary(content)}
                            </p>

                            <div className="flex items-center gap-2 text-[#558822] font-semibold hover:gap-3 transition-all">
                              {t("readMore")}
                              <ArrowRight className="h-4 w-4" />
                            </div>
                          </div>
                        </Link>
                      </div>
                    </div>
                  );
                })()}

                {/* Blog Grid */}
                {otherBlogs.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {otherBlogs.map((blog) => {
                      const title = getBlogTitle(blog);
                      const content = getBlogContent(blog);
                      const primaryImageUrl = getPrimaryImageUrl(blog);

                      return (
                        <Link key={blog._id} href={`/blogs/${blog._id}`}>
                          <div className="cursor-pointer group">
                            {primaryImageUrl && (
                              <div className="relative h-64 w-full bg-gray-200 rounded-lg overflow-hidden mb-6">
                                <Image
                                  src={primaryImageUrl}
                                  alt={title}
                                  fill
                                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                                  unoptimized={true}
                                />
                              </div>
                            )}

                            <div>
                              <h3 className="text-xl font-bold text-gray-900 mb-3 hover:text-[#558822] transition-colors uppercase font-[agrandir]">
                                {title}
                              </h3>

                              <p className="text-gray-600 text-sm mb-4 line-clamp-2 font-[Maison_Neue]">
                                {getShortSummary(content)}
                              </p>

                              <div className="flex items-center gap-2 text-[#558822] font-semibold text-sm hover:gap-3 transition-all">
                                {t("readMore")}
                                <ArrowRight className="h-4 w-4" />
                              </div>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20">
                <p className="text-gray-600 text-lg mb-4">{t("empty.title")}</p>
                <p className="text-gray-500">{t("empty.subtitle")}</p>
              </div>
            )}
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}
