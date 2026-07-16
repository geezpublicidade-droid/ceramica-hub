export function SceneLighting() {
  return (
    <>
      <ambientLight intensity={0.35} color="#8fb8ff" />
      <directionalLight position={[6, 10, 4]} intensity={0.6} color="#dce8ff" />
      <pointLight position={[0, -4, 6]} intensity={0.4} color="#2997ff" distance={30} decay={2} />
    </>
  );
}
