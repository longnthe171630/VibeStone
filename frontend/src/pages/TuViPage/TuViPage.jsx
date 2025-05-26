import React, { useState } from "react";
import "./TuViPage.css"; // Import your CSS styles

const API_BASE = "http://localhost:5000/api"; // Change port if needed

function TuViPage() {
  const [activeTab, setActiveTab] = useState("info");
  const [userInfo, setUserInfo] = useState({
    birthYear: "",
    gender: "",
    preferences: "",
    name: "",
  });
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const analyzeUser = async () => {
    if (!userInfo.birthYear) {
      setError("Vui lòng nhập năm sinh");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE}/analyze-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          birthYear: parseInt(userInfo.birthYear),
          gender: userInfo.gender || undefined,
          preferences: userInfo.preferences || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Lỗi phân tích");
      }

      setAnalysis(data.data);
      setActiveTab("analysis");
    } catch (err) {
      console.error("Analysis error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <nav className="tab-nav">
        <button
          className={activeTab === "info" ? "active" : ""}
          onClick={() => setActiveTab("info")}
        >
          📝 Thông Tin
        </button>
        <button
          className={activeTab === "analysis" ? "active" : ""}
          onClick={() => setActiveTab("analysis")}
        >
          🔍 Phân Tích
        </button>
      </nav>

      <main className="app-main">
        {error && <div className="error-message">⚠️ {error}</div>}

        {activeTab === "info" && (
          <div className="tab-content">
            <div className="user-info-form">
              <h2>Thông Tin Cá Nhân</h2>

              <div className="form-group">
                <label>Họ Và Tên *</label>
                <input
                  type="text"
                  min="1900"
                  max="2100"
                  value={userInfo.name}
                  onChange={(e) =>
                    setUserInfo((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="Ví dụ: Nguyễn Văn A"
                />
              </div>

              <div className="form-group">
                <label>Năm sinh *</label>
                <input
                  type="number"
                  min="1900"
                  max="2100"
                  value={userInfo.birthYear}
                  onChange={(e) =>
                    setUserInfo((prev) => ({
                      ...prev,
                      birthYear: e.target.value,
                    }))
                  }
                  placeholder="Ví dụ: 2003"
                />
              </div>

              <div className="form-group">
                <label>Giới tính</label>
                <select
                  value={userInfo.gender}
                  onChange={(e) =>
                    setUserInfo((prev) => ({ ...prev, gender: e.target.value }))
                  }
                >
                  <option value="">Chọn giới tính</option>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                </select>
              </div>

              <div className="form-group">
                <label>Ghi chú</label>
                <textarea
                  value={userInfo.preferences}
                  onChange={(e) =>
                    setUserInfo((prev) => ({
                      ...prev,
                      preferences: e.target.value,
                    }))
                  }
                  placeholder="Ghi chú thêm (tùy chọn)..."
                  rows="3"
                />
              </div>

              <button
                className="analyze-btn"
                onClick={analyzeUser}
                disabled={loading || !userInfo.birthYear}
              >
                {loading ? "⏳ Đang phân tích..." : "🔍 Phân Tích Mệnh"}
              </button>
            </div>
          </div>
        )}

        {activeTab === "analysis" && (
          <div className="tab-content">
            {analysis ? (
              <div className="analysis-result">
                <h2>Kết Quả Phân Tích</h2>

                <div className="analysis-card">
                  <h3>🌟 Thông Tin Mệnh</h3>
                  <div className="element-info">
                    <span className="element-badge">
                      {analysis.element || "Chưa xác định"}
                    </span>
                    <p>Họ Và Tên: {analysis.name || userInfo.name}</p>
                    <p>Năm sinh: {analysis.birthYear || userInfo.birthYear}</p>
                  </div>
                </div>

                <div className="analysis-card">
                  <h3>🎨 Màu Sắc</h3>
                  <div className="color-section">
                    {analysis.compatibleColors &&
                      analysis.compatibleColors.length > 0 && (
                        <div>
                          <h4>Màu tương hợp:</h4>
                          <div className="color-list">
                            {analysis.compatibleColors.map((color, idx) => (
                              <span key={idx} className="color-tag compatible">
                                {color}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    {analysis.beneficialColors &&
                      analysis.beneficialColors.length > 0 && (
                        <div>
                          <h4>Màu có lợi:</h4>
                          <div className="color-list">
                            {analysis.beneficialColors.map((color, idx) => (
                              <span key={idx} className="color-tag beneficial">
                                {color}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    {analysis.avoidColors &&
                      analysis.avoidColors.length > 0 && (
                        <div>
                          <h4>Màu nên tránh:</h4>
                          <div className="color-list">
                            {analysis.avoidColors.map((color, idx) => (
                              <span key={idx} className="color-tag avoid">
                                {color}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                </div>

                {analysis.luckyDirections &&
                  analysis.luckyDirections.length > 0 && (
                    <div className="analysis-card">
                      <h3>🧭 Hướng May Mắn</h3>
                      <div className="directions">
                        {analysis.luckyDirections.map((direction, idx) => (
                          <span key={idx} className="direction-tag">
                            {direction}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                {analysis.luckyNumbers && analysis.luckyNumbers.length > 0 && (
                  <div className="analysis-card">
                    <h3>🔢 Số May Mắn</h3>
                    <div className="numbers">
                      {analysis.luckyNumbers.map((number, idx) => (
                        <span key={idx} className="number-tag">
                          {number}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {analysis.analysis && (
                  <div className="analysis-card">
                    <h3>📋 Phân Tích Chi Tiết</h3>
                    <div className="analysis-text">
                      {analysis.analysis.split("\n").map((line, idx) => (
                        <p key={idx}>{line}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="no-analysis">
                <p>
                  Chưa có kết quả phân tích. Vui lòng nhập thông tin và phân
                  tích mệnh trước.
                </p>
                <button onClick={() => setActiveTab("info")}>
                  📝 Nhập Thông Tin
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default TuViPage;
