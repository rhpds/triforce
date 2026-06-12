package health

type Response struct {
	Status  string `json:"status"`
	Service string `json:"service"`
	Version string `json:"version"`
}

type Checker struct{}

func New() *Checker {
	return &Checker{}
}

func (c *Checker) Check() Response {
	return Response{
		Status:  "healthy",
		Service: "orchestrator",
		Version: "0.1.0",
	}
}
