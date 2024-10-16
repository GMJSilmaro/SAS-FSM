import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Container, Row, Col, Card } from "react-bootstrap";
import { db } from "../../../../firebase";
import { doc, getDoc } from "firebase/firestore";
import UpdateJobForm from "sub-components/dashboard/jobs/UpdateJobs";

const UpdateJob = () => {
  const router = useRouter();
  const { jobId } = router.query;
  const [jobData, setJobData] = useState(null);

  useEffect(() => {
    if (jobId) {
      const fetchJobData = async () => {
        console.log(jobData);
        const jobRef = doc(db, "jobs", jobId);
        const jobSnap = await getDoc(jobRef);
        if (jobSnap.exists()) {
          setJobData({ id: jobSnap.id, ...jobSnap.data() });
        }
      };
      fetchJobData();
    }
  }, [jobId]);

  return (
    <Container>
      <Row>
        <Col xl={12} lg={12} md={12} sm={12}>
          <Card className="shadow-sm">
            <Card.Body>
              {jobData ? (
                <UpdateJobForm jobData={jobData} jobId={jobId} />
              ) : (
                <p>Loading...</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default UpdateJob;
