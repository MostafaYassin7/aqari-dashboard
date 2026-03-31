import { Skeleton, Space } from "antd";

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 8 }) => (
  <Space direction="vertical" style={{ width: "100%" }}>
    {Array.from({ length: rows }).map((_, i) => (
      <Skeleton key={i} active paragraph={{ rows: 1 }} title={false} />
    ))}
  </Space>
);
