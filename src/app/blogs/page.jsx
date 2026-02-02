"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import HeaderHome from "@/components/header-home";
import Footer from "@/components/footer";
import { ArrowRight } from "lucide-react";

const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function BlogsPage() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      const response = await fetch(`${backendUrl}/blogs`);
      if (response.ok) {
        const result = await response.json();
        console.log("Blogs fetched:", result.data);
        setBlogs(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch blogs:", error);
    } finally {
      setLoading(false);
    }
  };

  const getBlogSummary = (content) => {
    return content.length > 200 ? content.substring(0, 200) + "..." : content;
  };

  const getShortSummary = (content) => {
    return content.length > 100 ? content.substring(0, 100) + "..." : content;
  };

  const recentBlogs = blogs.slice(0, 3);
  const featuredBlog = blogs.length > 0 ? blogs[0] : null;
  const otherBlogs = blogs.slice(1);
  const hasFeaturedImage = Boolean(featuredBlog?.imageUrl);

  return (
    <>
      <HeaderHome />
      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="bg-white py-16 mt-10 border-b border-gray-200">
          <div className="container mx-auto px-6">
            <h1 className="text-5xl font-bold text-center text-gray-900 uppercase font-[agrandir]">
              Le blog du bien-être :<br />
              <span className="text-[#556822]">Astuces, alimentation & santé </span>
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
                    <h2 className="text-3xl font-bold text-gray-900 mb-8 font-[agrandir]">Articles récents</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {recentBlogs.map((blog) => (
                        <Link key={`recent-${blog._id}`} href={`/blogs/${blog._id}`}>
                          <div className="cursor-pointer group bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                            {blog.imageUrl && (
                              <div className="relative h-48 w-full bg-gray-200">
                                <Image
                                  src={blog.imageUrl}
                                  alt={blog.title}
                                  fill
                                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                                  unoptimized={true}
                                />
                              </div>
                            )}
                            <div className="p-6">
                              <h3 className="text-lg font-bold text-gray-900 mb-2 hover:text-[#558822] transition-colors line-clamp-2 font-[agrandir]">
                                {blog.title}
                              </h3>
                              <p className="text-gray-600 text-sm mb-4 line-clamp-3 font-[Maison_Neue]">
                                {getShortSummary(blog.content)}
                              </p>
                              <div className="flex items-center gap-2 text-[#558822] font-semibold text-sm hover:gap-3 transition-all">
                                Lire plus...
                                <ArrowRight className="h-4 w-4" />
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Featured Blog Post */}
                <h2 className="text-3xl font-bold text-gray-900 mb-8 font-[agrandir]">Tous les articles </h2>
                {featuredBlog && (
                  <div className={`grid grid-cols-1 gap-12 mb-16 ${hasFeaturedImage ? "lg:grid-cols-3" : ""}`}>
                    {/* Featured Image */}
                    {hasFeaturedImage && (
                      <div className="lg:col-span-2">
                        <Link href={`/blogs/${featuredBlog._id}`}>
                          <div className="relative h-96 w-full bg-gray-200 rounded-lg overflow-hidden cursor-pointer group">
                            <Image
                              src={featuredBlog.imageUrl}
                              alt={featuredBlog.title}
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
                            {featuredBlog.title}
                          </h2>
                          <p className="text-gray-600 text-sm mb-6 leading-relaxed font-[Maison_Neue]">
                            {getShortSummary(featuredBlog.content)}
                          </p>
                          <div className="flex items-center gap-2 text-[#558822] font-semibold hover:gap-3 transition-all">
                            Lire plus...
                            <ArrowRight className="h-4 w-4" />
                          </div>
                        </div>
                      </Link>
                    </div>
                  </div>
                )}

                {/* Blog Grid */}
                {otherBlogs.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {otherBlogs.map((blog) => (
                      <Link key={blog._id} href={`/blogs/${blog._id}`}>
                        <div className="cursor-pointer group">
                          {blog.imageUrl && (
                            <div className="relative h-64 w-full bg-gray-200 rounded-lg overflow-hidden mb-6">
                              <Image
                                src={blog.imageUrl}
                                alt={blog.title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                unoptimized={true}
                              />
                            </div>
                          )}
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3 hover:text-[#558822] transition-colors uppercase font-[agrandir]">
                              {blog.title}
                            </h3>
                            <p className="text-gray-600 text-sm mb-4 line-clamp-2 font-[Maison_Neue]">
                              {getShortSummary(blog.content)}
                            </p>
                            <div className="flex items-center gap-2 text-[#558822] font-semibold text-sm hover:gap-3 transition-all">
                              Lire plus...
                              <ArrowRight className="h-4 w-4" />
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20">
                <p className="text-gray-600 text-lg mb-4">
                  Aucun article disponible pour le moment.
                </p>
                <p className="text-gray-500">
                  Revenez bientôt pour découvrir nos nouveaux articles !
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}
