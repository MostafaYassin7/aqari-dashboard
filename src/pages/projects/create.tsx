import { useState } from "react";
import { useNotification } from "@refinedev/core";
import { useNavigate } from "react-router-dom";
import {
  Form,
  Input,
  InputNumber,
  Radio,
  Button,
  Card,
  Space,
  Typography,
  Row,
  Col,
  DatePicker,
} from "antd";
import { ArrowLeftOutlined, SendOutlined } from "@ant-design/icons";
import { axiosInstance } from "../../dataProvider";
import dayjs from "dayjs";

const { Title } = Typography;

export const ProjectCreate: React.FC = () => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const { open } = useNotification();
  const navigate = useNavigate();

  const handleSubmit = async (values: Record<string, unknown>) => {
    setSubmitting(true);
    try {
      // Convert dayjs to ISO string
      if (values.deliveryDate && (values.deliveryDate as { toISOString?: () => string }).toISOString) {
        values.deliveryDate = (values.deliveryDate as ReturnType<typeof dayjs>).toISOString();
      }

      // Strip null/empty
      const payload: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(values)) {
        if (v !== null && v !== undefined && v !== "") {
          payload[k] = v;
        }
      }

      const { data } = await axiosInstance.post("/projects", payload);
      const newId =
        (data?.data as Record<string, string>)?.id ||
        (data as Record<string, string>)?.id;

      open?.({ type: "success", message: "Project created successfully" });
      navigate(newId ? `/projects/${newId}` : "/projects");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      open?.({
        type: "error",
        message: error?.response?.data?.message || "Failed to create project",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Space>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/projects")}>
          Back
        </Button>
        <Title level={4} style={{ margin: 0 }}>
          Create Project
        </Title>
      </Space>

      <Card>
        <Form
          form={form}
          layout="vertical"
          size="large"
          onFinish={handleSubmit}
          style={{ maxWidth: 720 }}
        >
          <Form.Item name="title" label="Project Title" rules={[{ required: true }]}>
            <Input placeholder="e.g. Al Nakheel Tower" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={4} placeholder="Project overview…" />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="city" label="City" rules={[{ required: true }]}>
                <Input placeholder="e.g. Riyadh" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="district" label="District">
                <Input placeholder="e.g. Al Malaz" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="latitude" label="Latitude" rules={[{ required: true }]}>
                <InputNumber
                  step={0.000001}
                  style={{ width: "100%" }}
                  placeholder="24.7136"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="longitude" label="Longitude" rules={[{ required: true }]}>
                <InputNumber
                  step={0.000001}
                  style={{ width: "100%" }}
                  placeholder="46.6753"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="status" label="Project Status" rules={[{ required: true }]}>
            <Radio.Group>
              <Radio value="ready">Ready</Radio>
              <Radio value="off_plan">Off Plan</Radio>
            </Radio.Group>
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item name="deliveryDate" label="Delivery Date">
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="priceFrom" label="Price From (SAR)">
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="priceTo" label="Price To (SAR)">
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="address" label="Address">
            <Input />
          </Form.Item>

          <Space>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SendOutlined />}
              loading={submitting}
            >
              Create Project
            </Button>
            <Button onClick={() => navigate("/projects")}>Cancel</Button>
          </Space>
        </Form>
      </Card>
    </Space>
  );
};
