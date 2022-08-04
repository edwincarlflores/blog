import type { GetStaticProps, InferGetStaticPropsType, NextPage } from "next";
import Head from "next/head";
import type { BlogPost } from "../@types/notion";
import BlogCard from "../components/BlogCard";
import NotionService from "../services/notion-service";

export const getStaticProps: GetStaticProps = async (context) => {
  const notionService = new NotionService();

  const posts = await notionService.getPublishedBlogPosts();

  return {
    props: {
      posts,
    },
  };
};

const SEOWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <>
    <Head>
      <title>ECBF Blog</title>
      <meta
        name="description"
        title="description"
        content="Blogsite of Edwin Carl Flores"
      />
      <meta
        name="google-site-verification"
        content={process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION_KEY}
      />
      <link rel="icon" href="/favicon.ico" />
    </Head>

    <main className="min-h-screen">{children}</main>
  </>
);

const Home: NextPage = ({
  posts,
}: InferGetStaticPropsType<typeof getStaticProps>) => {
  return (
    <SEOWrapper>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-center">
          <h1 className="text-xl font-extrabold text-center text-black md:text-4xl">
            ECBF Blog
          </h1>
        </div>
        <div className="grid max-w-lg gap-6 mx-auto mt-12 lg:grid-cols-2 lg:max-w-none">
          {posts.map((post: BlogPost) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </SEOWrapper>
  );
};

export default Home;
