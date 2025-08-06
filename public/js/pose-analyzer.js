async function startCamera() {
    const video = document.getElementById("camera");
    video.style.display = 'block';

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
        await video.play();

        const net = await posenet.load({
            architecture: 'MobileNetV1',
            outputStride: 16,
            inputResolution: { width: 200, height: 150 },
            multiplier: 0.75
        });

        console.log("✅ PoseNet loaded successfully");
        setInterval(async () => {
            const pose = await net.estimateSinglePose(video);
            console.log("Pose detected:", pose);
            analyzePose(pose);
        }, 2000);

    } catch (err) {
        console.error("Camera failed to start:", err);
        video.style.display = 'none';
    }
}

window.startCamera = startCamera; // ✅ Expose globally
