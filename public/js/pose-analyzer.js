// // This file handles all camera and PoseNet logic for real-time analysis.

// /**
//  * Starts the camera and initializes the PoseNet model for pose estimation.
//  */

// setInterval(async () => {
//     const pose = await net.estimateSinglePose(video);
//     console.log("Pose detected:", pose); // DEBUG
//     analyzePose(pose);
// }, 2000);


// async function startCamera() {
//     const video = document.getElementById("camera");
//     video.style.display = 'block';

//     try {
//         const stream = await navigator.mediaDevices.getUserMedia({ video: true });
//         video.srcObject = stream;
//         await video.play();

//         const net = await posenet.load({
//             architecture: 'MobileNetV1',
//             outputStride: 16,
//             inputResolution: { width: 200, height: 150 },
//             multiplier: 0.75
//         });

//         setInterval(async () => {
//             const pose = await net.estimateSinglePose(video);
//             analyzePose(pose);
//         }, 2000); // Analyze every 2 seconds

//     } catch (err) {
//         console.error("Camera failed to start:", err);
//         video.style.display = 'none';
//     }
// }

// /**
//  * Analyzes the detected pose for posture and eye contact.
//  * @param {object} pose The pose object returned by PoseNet.
//  */
// function analyzePose(pose) {
//     const keypoints = pose.keypoints.reduce((map, kp) => {
//         map[kp.part] = kp;
//         return map;
//     }, {});

//     // Posture Analysis
//     if (keypoints.leftShoulder?.score > 0.5 && keypoints.rightShoulder?.score > 0.5 && keypoints.leftHip?.score > 0.5 && keypoints.rightHip?.score > 0.5) {
//         const shoulderY = (keypoints.leftShoulder.position.y + keypoints.rightShoulder.position.y) / 2;
//         const hipY = (keypoints.leftHip.position.y + keypoints.rightHip.position.y) / 2;
//         const spineVerticality = Math.abs(hipY - shoulderY);

//         if (spineVerticality < 60) {
//             updatePostureUI("poor", "Poor", "Slouching detected. Please sit up straighter.");
//         } else if (spineVerticality < 80) {
//             updatePostureUI("moderate", "Okay", "Slight slouch. Try to straighten your back.");
//         } else {
//             updatePostureUI("good", "Good", "Good posture, keep it up!");
//         }
//     }

//     // Eye Contact Analysis
//     const nose = keypoints.nose;
//     if (nose?.score > 0.6) {
//         const videoWidth = document.getElementById('camera').clientWidth;
//         if (nose.position.x < videoWidth * 0.35 || nose.position.x > videoWidth * 0.65) {
//             updateEyeContactUI("poor", "Looking Away");
//         } else {
//             updateEyeContactUI("good", "Good");
//         }
//     }
// }

// /**
//  * Updates the UI with posture feedback.
//  * @param {string} statusClass 'good', 'moderate', or 'poor'.
//  * @param {string} statusText The text for the status tag.
//  * @param {string} recommendation The actionable tip for the user.
//  */
// function updatePostureUI(statusClass, statusText, recommendation) {
//     document.getElementById("posture-status").className = `posture-tag ${statusClass}`;
//     document.getElementById("posture-status").textContent = `Posture: ${statusText}`;
//     document.getElementById("posture-recommendation").textContent = recommendation;
//     postureData.spineAngle = statusText; // The global object is still accessible
// }

// /**
//  * Updates the UI with eye contact feedback.
//  * @param {string} statusClass 'good' or 'poor'.
//  * @param {string} text The text for the status tag.
//  */
// function updateEyeContactUI(statusClass, text) {
//     document.getElementById("eye-contact-status").className = `posture-tag ${statusClass}`;
//     document.getElementById("eye-contact-status").textContent = `Eye Contact: ${text}`;
//     postureData.eyeContact = text; // The global object is still accessible
// }
// window.startCamera = startCamera;
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
