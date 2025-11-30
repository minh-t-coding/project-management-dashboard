package com.cooksys.groupfinal.entities;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.ManyToOne;

import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@NoArgsConstructor
@Data
@Getter
@Setter
public class Project {

	@Id
	@GeneratedValue
	private Long id;

	private String name;

	private String description;

	private boolean active;

	@ManyToOne
	private Team team;

}