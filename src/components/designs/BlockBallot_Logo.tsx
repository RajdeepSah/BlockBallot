// components/BlockBallotLogo.tsx
import { useEffect, useRef } from "react";

const BlockBallotLogo: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size to match container
    const updateCanvasSize = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };
    updateCanvasSize();

    const logoText = "Block Ballot";
    const colors = {
      navy: "#001F54",
      lightPaper: "#E0E0E0",
      shadow: "rgba(0, 0, 0, 0.2)"
    };

    let angle = 0;

    function drawCuboid(x: number, y: number, width: number, height: number, depth: number) {
      if (!ctx) return;

      // Main face
      ctx.fillStyle = colors.lightPaper;
      ctx.fillRect(x, y, width, height);

      // Side face (3D effect)
      ctx.fillStyle = colors.navy;
      ctx.beginPath();
      ctx.moveTo(x + width, y);
      ctx.lineTo(x + width + depth, y - depth);
      ctx.lineTo(x + width + depth, y + height - depth);
      ctx.lineTo(x + width, y + height);
      ctx.closePath();
      ctx.fill();

      // Top face
      ctx.fillStyle = colors.shadow;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + depth, y - depth);
      ctx.lineTo(x + width + depth, y - depth);
      ctx.lineTo(x + width, y);
      ctx.closePath();
      ctx.fill();
    }

    function drawLogo() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw on center of canvas (which is now the container)
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      const cuboidWidth = 150;
      const cuboidHeight = 150;
      const depth = 30;

      const rotatedX = centerX + Math.sin(angle) * 50;
      const rotatedY = centerY + Math.cos(angle) * 30;

      drawCuboid(rotatedX - cuboidWidth / 2, rotatedY - cuboidHeight / 2, cuboidWidth, cuboidHeight, depth);

      // Draw text
      ctx.fillStyle = colors.navy;
      ctx.font = "bold 48px Arial";
      ctx.fillText(logoText, centerX - ctx.measureText(logoText).width / 2, centerY + 15);

      angle += 0.02;
      requestAnimationFrame(drawLogo);
    }

    drawLogo();

    const handleResize = () => {
      updateCanvasSize();
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%" }}>
      <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "100%" }} />
    </div>
  );
};

export { BlockBallotLogo };