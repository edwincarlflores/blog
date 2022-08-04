import { GetStaticProps, InferGetStaticPropsType } from "next";
import ReactMarkdown from "react-markdown";
import Head from "next/head";
import NotionService from "../../services/notion-service";
import { BlogPost } from "../../@types/notion";

const SEOWrapper: React.FC<{ children: React.ReactNode; post: BlogPost }> = ({
  children,
  post,
}) => (
  <>
    <Head>
      <title>{post.title}</title>
      <meta
        name={"description"}
        title={"description"}
        content={post.description}
      />
      <meta name={"og:title"} title={"og:title"} content={post.title} />
      <meta
        name={"og:description"}
        title={"og:description"}
        content={post.description}
      />
      <meta name={"og:image"} title={"og:image"} content={post.cover} />
      <meta
        name="google-site-verification"
        content={process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION_KEY}
      />
    </Head>

    <div className="min-h-screen">
      <main className="relative max-w-5xl mx-auto">{children}</main>
    </div>
  </>
);

const Post = ({
  markdown,
  post,
}: InferGetStaticPropsType<typeof getStaticProps>) => {
  return (
    <SEOWrapper post={post}>
      <div className="flex items-center justify-center">
        <article className="prose">
          <ReactMarkdown>{markdown}</ReactMarkdown>
        </article>
      </div>
    </SEOWrapper>
  );
};

export const getStaticProps: GetStaticProps = async (context) => {
  const notionService = new NotionService();

  // @ts-ignore
  const post = await notionService.getBlogPost(context.params?.slug);

  if (!post) {
    throw "";
  }

  return {
    props: {
      markdown: post.markdown,
      post: post.post,
    },
  };
};

export async function getStaticPaths() {
  const notionService = new NotionService();

  const posts = await notionService.getPublishedBlogPosts();

  // Since static paths are generated, redeploy site whenever
  // changes are made in Notion.
  const paths = posts.map((post) => {
    return `/post/${post.slug}`;
  });

  return {
    paths,
    fallback: false,
  };
}

export default Post;
