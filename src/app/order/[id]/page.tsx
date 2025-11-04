"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const API_BASE = "http://localhost:8080/order";

type OrderItem = {
  id?: number | string;
  code?: string;
  number?: number;
  created_at?: string;
  [key: string]: unknown;
};

type OrderResponse =
  | {
      count?: number;
      restaurant_name?: string;
      orders?: OrderItem[];
      [key: string]: unknown;
    }
  | OrderItem[]
  | Record<string, unknown>;

export default function OrderSolutionPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const rawId = params?.id;
  const restaurantId = Array.isArray(rawId) ? rawId[0] ?? "" : rawId ?? "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<OrderResponse | null>(null);

  useEffect(() => {
    const token = window.localStorage.getItem("access_token");

    if (!token) {
      setError("Missing access token. Please log in again.");
      router.replace("/");
      return;
    }

    if (!restaurantId) {
      setError("Missing restaurant id in URL. Try navigating from the profile page.");
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      setError(null);
      setOrders(null);

      try {
        const response = await fetch(`${API_BASE}/${restaurantId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401) {
          window.localStorage.removeItem("access_token");
          router.replace("/");
          return;
        }

        if (response.status === 403) {
          setError("Bạn không có quyền truy cập");
          setLoading(false);
          return;
        }

        const rawText = await response.text();
        let parsedBody: unknown = null;

        if (rawText) {
          try {
            parsedBody = JSON.parse(rawText);
          } catch {
            parsedBody = rawText;
          }
        }

        if (!response.ok) {
          const message =
            typeof parsedBody === "object" && parsedBody !== null && "message" in parsedBody
              ? String((parsedBody as { message: unknown }).message)
              : `Order request failed with status ${response.status}`;

          throw new Error(message);
        }

        setOrders(parsedBody as OrderResponse);
      } catch (fetchError) {
        const message = fetchError instanceof Error ? fetchError.message : "Failed to load orders.";
        setError(message);
      } finally {
        setLoading(false);
      }
    })();
  }, [restaurantId, router]);

  function renderOrderTable() {
    if (loading) {
      return <div className="status info">Đang tải danh sách đơn hàng…</div>;
    }

    if (error) {
      return (
        <div className="status error">
          <strong>{error}</strong>
          <small>Vui lòng thử lại hoặc kiểm tra kết nối tới máy chủ.</small>
        </div>
      );
    }

    if (!orders) {
      return <div className="status info">Không có dữ liệu đơn hàng.</div>;
    }

    if (Array.isArray(orders)) {
      return (
        <div className="table-wrapper">
          <table className="data-table orders">
            <thead>
              <tr>
                <th>STT</th>
                <th>Mã hàng</th>
                <th>Số lượng</th>
                <th>Ngày tạo</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((item, index) => {
                const entry = typeof item === "object" && item !== null ? (item as OrderItem) : {};
                const code = entry.code ?? "-";
                const quantity =
                  typeof entry.number === "number" || typeof entry.number === "string"
                    ? entry.number
                    : "-";
                const created = entry.created_at ?? "-";

                return (
                  <tr key={index}>
                    <td className="sequence-cell">{index + 1}</td>
                    <td className="code-cell">{code}</td>
                    <td>{quantity}</td>
                    <td>{created}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }

    if (typeof orders === "object" && orders !== null) {
      const { count, restaurant_name, orders: rows, ...rest } = orders as {
        count?: number;
        restaurant_name?: string;
        orders?: OrderItem[];
      };
      const list = Array.isArray(rows) ? rows : [];

      return (
        <>
          <div className="status info">
            <strong>Tổng số: {typeof count === "number" ? count : list.length}</strong>
          </div>
          {restaurant_name && (
            <div className="status info">
              <strong>Nhà hàng: {restaurant_name}</strong>
            </div>
          )}

          {list.length > 0 ? (
            <div className="table-wrapper">
              <table className="data-table orders">
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>Mã hàng</th>
                    <th>Số lượng</th>
                    <th>Ngày tạo</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((item, index) => {
                    const code = item.code ?? "-";
                    const quantity =
                      typeof item.number === "number" || typeof item.number === "string"
                        ? item.number
                        : "-";
                    const created = item.created_at ?? "-";

                    return (
                      <tr key={index}>
                        <td className="sequence-cell">{index + 1}</td>
                        <td className="code-cell">{code}</td>
                        <td>{quantity}</td>
                        <td>{created}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="status info">Không có đơn hàng nào.</div>
          )}

          {Object.keys(rest).length > 0 && (
            <div className="status info">
              <small>Dữ liệu bổ sung: {formatValue(rest)}</small>
            </div>
          )}
        </>
      );
    }

    return <div className="status info">{formatValue(orders)}</div>;
  }

  return (
    <section className="profile-card order-card">
      <header>
        <h1>Demo solution broken access control</h1>
        <p>
          Danh sách nguyên liệu đã đặt hàng. Chỉ được xem danh sách đặt hàng của nhà hàng mình
        </p>
      </header>

      {renderOrderTable()}

      <div className="action-buttons single">
        <button type="button" className="action-button active" onClick={() => router.push("/profile")}>
          Back to profile
        </button>
      </div>
    </section>
  );
}

function formatValue(value: unknown): string {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (value === null || typeof value === "undefined") {
    return "-";
  }

  if (Array.isArray(value)) {
    return value.map(formatValue).join(", ");
  }

  if (typeof value === "object") {
    if (Object.keys(value as Record<string, unknown>).length === 0) {
      return "-";
    }
    return JSON.stringify(value);
  }

  return String(value);
}
