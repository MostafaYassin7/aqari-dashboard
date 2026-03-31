import { useState } from "react";
import { useNavigation } from "@refinedev/core";
import {
  Table,
  Space,
  Typography,
  Tag,
  Button,
  Alert,
  Card,
  Empty,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  ReadOutlined,
  DeleteOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

// Blog posts are stored locally in localStorage until a backend blog API is implemented.
// Replace with real API calls when GET/POST /api/v1/blog endpoints exist.

interface BlogPost {
  id: string;
  title: string;
  status: "draft" | "published";
  createdAt: string;
  updatedAt: string;
  content: string;
  excerpt?: string;
}

function getPosts(): BlogPost[] {
  try {
    return JSON.parse(localStorage.getItem("aqar_blog_posts") || "[]");
  } catch {
    return [];
  }
}

function savePosts(posts: BlogPost[]) {
  localStorage.setItem("aqar_blog_posts", JSON.stringify(posts));
}

export const BlogList: React.FC = () => {
  const { create, edit } = useNavigation();
  const [posts, setPosts] = useState<BlogPost[]>(getPosts());

  const handleDelete = (id: string) => {
    const updated = posts.filter((p) => p.id !== id);
    savePosts(updated);
    setPosts(updated);
  };

  const handleToggleStatus = (id: string) => {
    const updated = posts.map((p) =>
      p.id === id
        ? { ...p, status: p.status === "published" ? ("draft" as const) : ("published" as const) }
        : p
    );
    savePosts(updated);
    setPosts(updated);
  };

  const columns = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      render: (v: string) => <Text strong>{v}</Text>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (v: string) => (
        <Tag color={v === "published" ? "green" : "default"}>
          {v?.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (v: string) => new Date(v).toLocaleDateString(),
    },
    {
      title: "Updated",
      dataIndex: "updatedAt",
      key: "updatedAt",
      render: (v: string) => new Date(v).toLocaleDateString(),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: unknown, record: BlogPost) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => edit("blog", record.id)}
          >
            Edit
          </Button>
          <Button
            size="small"
            onClick={() => handleToggleStatus(record.id)}
          >
            {record.status === "published" ? "Unpublish" : "Publish"}
          </Button>
          <Button
            icon={<DeleteOutlined />}
            size="small"
            danger
            onClick={() => handleDelete(record.id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Space style={{ justifyContent: "space-between", width: "100%" }}>
        <Space>
          <ReadOutlined style={{ fontSize: 20, color: "#1677ff" }} />
          <Title level={4} style={{ margin: 0 }}>
            Blog Posts
          </Title>
        </Space>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => create("blog")}
        >
          New Post
        </Button>
      </Space>

      <Alert
        type="info"
        showIcon
        message="Local Storage Mode"
        description="Blog posts are currently stored in browser localStorage. Implement GET/POST/PATCH/DELETE /api/v1/blog endpoints on the backend to enable persistent storage. This UI is fully ready to switch to real API."
      />

      <Table
        dataSource={posts}
        columns={columns}
        rowKey="id"
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <Space direction="vertical" align="center">
                  <Text>No blog posts yet</Text>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => create("blog")}
                  >
                    Create your first post
                  </Button>
                </Space>
              }
            />
          ),
        }}
      />
    </Space>
  );
};
