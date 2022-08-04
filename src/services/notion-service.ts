import type { BlogPost, PostPage } from "./../@types/notion.d";
import { Client } from "@notionhq/client";
import { NotionToMarkdown } from "notion-to-md";

const databaseId = process.env.NOTION_BLOG_DATABASE_ID ?? "";

export default class NotionService {
  client: Client;
  n2m: NotionToMarkdown;

  constructor() {
    this.client = new Client({ auth: process.env.NOTION_ACCESS_TOKEN });
    this.n2m = new NotionToMarkdown({ notionClient: this.client });
  }

  private async getPageProperty(
    pageId: string,
    propertyId: string
  ): Promise<any> {
    return await this.client.pages.properties.retrieve({
      page_id: pageId,
      property_id: propertyId,
    });
  }

  private async getProperties(page: any): Promise<any> {
    const [name, tags, description, updated, slug] = await Promise.all([
      this.getPageProperty(page?.id, page?.properties.Name.id),
      this.getPageProperty(page?.id, page?.properties.Tags.id),
      this.getPageProperty(page?.id, page?.properties.Description.id),
      this.getPageProperty(page?.id, page?.properties.Updated.id),
      this.getPageProperty(page?.id, page?.properties.Slug.id),
    ]);

    return {
      name,
      tags,
      description,
      updated,
      slug,
    };
  }

  async getPublishedBlogPosts(): Promise<BlogPost[]> {
    // list blog posts
    const response = await this.client.databases.query({
      database_id: databaseId,
      filter: {
        property: "Published",
        checkbox: {
          equals: true,
        },
      },
      sorts: [
        {
          property: "Updated",
          direction: "descending",
        },
      ],
    });

    // const properties = await this.getProperties(response.results);
    const properties = await Promise.all(
      response.results.map(async (page: any) => {
        return await this.getProperties(page);
      })
    );

    return response.results.map((page, index) => {
      // transform this response to a blog post
      return this.pageToPostTransformer(page, properties[index]);
    });
  }

  async getBlogPost(slug: string): Promise<PostPage> {
    const response = await this.client.databases.query({
      database_id: databaseId,
      filter: {
        property: "Slug",
        formula: {
          string: {
            equals: slug,
          },
        },
      },
      sorts: [
        {
          property: "Updated",
          direction: "descending",
        },
      ],
    });

    if (!response.results[0]) {
      throw "No results available";
    }

    const properties = await this.getProperties(response.results[0]);

    const page = response.results[0];
    const mdblocks = await this.n2m.pageToMarkdown(page.id);
    const markdown = this.n2m.toMarkdownString(mdblocks);
    const post = this.pageToPostTransformer(page, properties);

    return {
      post,
      markdown,
    };
  }

  // TODO: Create type/interface for page
  private pageToPostTransformer(page: any, properties: any): BlogPost {
    let cover = page?.cover || "";

    const { name, tags, description, updated, slug } = properties;

    switch (cover.type) {
      case "file":
        cover = page.cover.file;
        break;
      case "external":
        cover = page.cover.external.url;
        break;
      default:
        cover = "";
    }

    return {
      id: page.id,
      cover,
      title: name.results[0]?.title.plain_text || "",
      tags: tags.multi_select,
      description: description.results[0]?.rich_text?.plain_text || "",
      date: updated.last_edited_time,
      slug: slug.formula.string,
    };
  }
}
