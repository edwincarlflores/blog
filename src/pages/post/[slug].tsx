import { GetStaticProps, InferGetStaticPropsType } from "next";
import ReactMarkdown from "react-markdown";
import Head from "next/head";
import { useRouter } from "next/router";
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
  const router = useRouter();

  if (router.isFallback) {
    return <h2>Loading...</h2>;
  }

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
    fallback: true,
  };
}

export default Post;
