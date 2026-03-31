import { useState, useEffect } from "react";
import { useNavigation } from "@refinedev/core";
import { useParams } from "react-router-dom";
import {
  Card,
  Form,
  Input,
  Button,
  Space,
  Typography,
  Select,
  Row,
  Col,
} from "antd";
import { ArrowLeftOutlined, SaveOutlined } from "@ant-design/icons";

const { Title } = Typography;

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

export const BlogEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { list } = useNavigation();
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const [post, setPost] = useState<BlogPost | null>(null);

  useEffect(() => {
    const posts = getPosts();
    const found = posts.find((p) => p.id === id);
    if (found) {
      setPost(found);
      form.setFieldsValue(found);
    }
  }, [id, form]);

  const handleSubmit = async (values: Record<string, unknown>) => {
    setSaving(true);
    const posts = getPosts();
    const updated = posts.map((p) =>
      p.id === id
        ? {
            ...p,
            title: values.title as string,
            content: values.content as string,
            excerpt: values.excerpt as string,
            status: values.status as "draft" | "published",
            updatedAt: new Date().toISOString(),
          }
        : p
    );
    localStorage.setItem("aqar_blog_posts", JSON.stringify(updated));
    setSaving(false);
    list("blog");
  };

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Space>
        <Button icon={<ArrowLeftOutlined />} onClick={() => list("blog")}>
          Back
        </Button>
        <Title level={4} style={{ margin: 0 }}>
          Edit Blog Post
        </Title>
      </Space>

      <Card>
        <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={post || {}}>
          <Row gutter={[16, 0]}>
            <Col xs={24} lg={18}>
              <Form.Item
                name="title"
                label="Title"
                rules={[{ required: true, message: "Title is required" }]}
              >
                <Input size="large" placeholder="Post title" />
              </Form.Item>
            </Col>
            <Col xs={24} lg={6}>
              <Form.Item name="status" label="Status">
                <Select size="large">
                  <Select.Option value="draft">Draft</Select.Option>
                  <Select.Option value="published">Published</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="excerpt" label="Excerpt">
            <Input.TextArea rows={2} placeholder="Short description for preview..." />
          </Form.Item>

          <Form.Item
            name="content"
            label="Content"
            rules={[{ required: true, message: "Content is required" }]}
          >
            <Input.TextArea
              rows={16}
              placeholder="Write your blog post content here..."
              style={{ fontFamily: "monospace" }}
            />
          </Form.Item>

          <Space>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>
              Save Changes
            </Button>
            <Button onClick={() => list("blog")}>Cancel</Button>
          </Space>
        </Form>
      </Card>
    </Space>
  );
};
