package com.cooksys.groupfinal.services;

import com.cooksys.groupfinal.dtos.ProjectDto;
import com.cooksys.groupfinal.dtos.ProjectRequestDto;

public interface ProjectService {

	ProjectDto updateProject(Long id, ProjectRequestDto project);

	ProjectDto createProject(ProjectRequestDto project);

	void deleteProject(Long id);

}
