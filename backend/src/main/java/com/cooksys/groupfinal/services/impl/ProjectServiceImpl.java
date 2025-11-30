package com.cooksys.groupfinal.services.impl;

import java.util.Optional;

import org.springframework.stereotype.Service;

import com.cooksys.groupfinal.dtos.ProjectDto;
import com.cooksys.groupfinal.dtos.ProjectRequestDto;
import com.cooksys.groupfinal.entities.Project;
import com.cooksys.groupfinal.entities.Team;
import com.cooksys.groupfinal.exceptions.BadRequestException;
import com.cooksys.groupfinal.exceptions.NotFoundException;
import com.cooksys.groupfinal.mappers.ProjectMapper;
import com.cooksys.groupfinal.mappers.TeamMapper;
import com.cooksys.groupfinal.repositories.ProjectRepository;
import com.cooksys.groupfinal.repositories.TeamRepository;
import com.cooksys.groupfinal.services.ProjectService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProjectServiceImpl implements ProjectService {

	private final ProjectRepository projectRepository;
	private final ProjectMapper projectMapper;
	private final TeamRepository teamRepository;

	private final TeamMapper teamMapper;

	private Team findTeam(Long id) {
		Optional<Team> team = teamRepository.findById(id);
		if (team.isEmpty()) {
			throw new NotFoundException("A team with the provided id does not exist.");
		}
		return team.get();
	}

	@Override
	public ProjectDto updateProject(Long id, ProjectRequestDto project) {
		if (id == null) {
			throw new BadRequestException("Invalid project ID");
		}
		Optional<Project> tempProject = projectRepository.findById(id);
		if (tempProject.isEmpty()) {
			throw new NotFoundException("Project not found");
		}
		Project storeProject = tempProject.get();
		if (project.getName() != null) {
			storeProject.setName(project.getName());
		}
		if (project.getDescription() != null) {
			storeProject.setDescription(project.getDescription());
		}

		if (project.getActive() != null) {
			storeProject.setActive(project.getActive());
		}

		if (project.getTeamId() != null) {
			Team newTeam = findTeam(project.getTeamId());
			if (!storeProject.getTeam().getCompany().getId().equals(newTeam.getCompany().getId())) {
				throw new BadRequestException("Project cannot be reassigned across companies.");
			}
			storeProject.setTeam(newTeam);
		}

		Project updatedProject = projectRepository.save(storeProject);
		return projectMapper.entityToDto(updatedProject);
	}

	@Override
	public ProjectDto createProject(ProjectRequestDto project) {
		if (project == null || project.getTeamId() == null) {
			throw new BadRequestException("Invalid team ID");
		}
		Project tempProject = projectMapper.requestDtoToEntity(project);
		tempProject.setTeam(findTeam(project.getTeamId()));
		Project savedProject = projectRepository.save(tempProject);
		return projectMapper.entityToDto(savedProject);
	}

	@Override
	public void deleteProject(Long id) {
		if (id == null) {
			throw new BadRequestException("Invalid project ID");
		}
		Optional<Project> project = projectRepository.findById(id);
		if (project.isEmpty()) {
			throw new NotFoundException("Project not found");
		}
		projectRepository.delete(project.get());
	}
}
